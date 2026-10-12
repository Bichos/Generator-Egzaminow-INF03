// Test integracyjny na prawdziwym silniku: MariaDB/MySQL + PHP (wymaga poleceń `mysql` i `php`).
// Dla wielu losowych arkuszy:
//   1. importuje wygenerowany zrzut bazy,
//   2. wykonuje każdą kwerendę i porównuje wynik z oczekiwanym wynikiem z klucza,
//   3. (wariant PHP) uruchamia rozwiązanie wzorcowe przez `php -S`, wysyła GET oraz POST z formularzy
//      i sprawdza, że nie ma błędów PHP, a strona zawiera dane z bazy.
// Uruchomienie: node tests/integration.mjs [liczba_arkuszy]
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateExam } from '../js/core/exam.js';

const COUNT = Number(process.argv[2] || 40);
const MYSQL = ['-uroot', '-h127.0.0.1', '--batch', '--skip-column-names', '--default-character-set=utf8mb4'];

const sh = (cmd, args, input) => execFileSync(cmd, args, { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
const mysql = (sql, db) => sh('mysql', [...MYSQL, ...(db ? [db] : [])], sql);

function cell(v) {
  if (v === null || v === undefined) return 'NULL';
  return String(v);
}

function compareSelect(q, out) {
  const got = out.split('\n').filter((l) => l !== '').map((l) => l.split('\t'));
  const exp = q.result.rows.map((r) => r.map(cell));
  if (q.spec.random) return got.length === exp.length ? null : `liczba wierszy ${got.length} != ${exp.length}`;
  const norm = (rows) => rows.map((r) => r.join('|')).sort();
  const a = norm(got);
  const b = norm(exp);
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (q.spec.limit && got.length === exp.length) {
    // remis na granicy LIMIT - porównujemy jedynie kolumnę sortowania
    const o = q.spec.orderBy?.[0];
    const idx = o ? (o.field !== undefined ? o.field : q.spec.fields.findIndex((f) => f.c === o.c && f.t === o.t)) : -1;
    if (idx >= 0 && JSON.stringify(got.map((r) => r[idx])) === JSON.stringify(exp.map((r) => r[idx]))) return null;
  }
  return `różnica wyników\n  MySQL:    ${a.slice(0, 6).join(' ; ')}\n  oczekiwane: ${b.slice(0, 6).join(' ; ')}`;
}

async function withPhpServer(dir, fn) {
  const port = 8800 + Math.floor(Math.random() * 500);
  const proc = spawn('php', ['-d', 'display_errors=1', '-d', 'error_reporting=E_ALL', '-S', `127.0.0.1:${port}`, '-t', dir], { stdio: 'ignore' });
  try {
    for (let i = 0; i < 40; i++) {
      try {
        await fetch(`http://127.0.0.1:${port}/`);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    proc.kill();
  }
}

const PHP_ERROR = /(Warning|Fatal error|Parse error|Notice|Deprecated|Uncaught)/;

async function checkPhp(exam, problems) {
  const dir = mkdtempSync(join(tmpdir(), 'inf03-'));
  for (const [name, code] of Object.entries(exam.solution)) writeFileSync(join(dir, name), code);
  try {
    await withPhpServer(dir, async (base) => {
      for (const page of exam.site.pages) {
        const html = await (await fetch(`${base}/${page.file}`)).text();
        if (PHP_ERROR.test(html)) problems.push(`${page.file} (GET): ${html.match(/.*(Warning|Fatal error|Parse error|Notice|Deprecated|Uncaught).*/)[0].slice(0, 200)}`);
        if (/<\?php/.test(html)) problems.push(`${page.file}: kod PHP nie został wykonany`);
      }
      // Formularze POST z przykładowymi danymi
      for (const r of exam.site.rendered) {
        const body = new URLSearchParams();
        if (r.widget.id === 'phpSelectDetail') {
          body.set('id', String(r.state.detail.result.param.value));
          body.set('ilosc', '3');
        } else if (r.widget.id === 'phpRadioFilter') {
          body.set(r.state.ref.result.param.col, r.state.values[1] || r.state.values[0]);
        } else if (r.widget.id === 'phpInsertForm') {
          for (const [c, v] of Object.entries(r.state.ref.result.spec.values)) if (!(v && v.raw)) body.set(c, String(v));
        } else if (r.widget.id === 'phpSearchLike') {
          body.set('fraza', r.state.ref.result.param.value);
        } else if (r.widget.id === 'phpUpdateForm') {
          body.set('rekord', String(r.state.ref.result.param.id));
          body.set('wartosc', '7');
        } else continue;
        const html = await (await fetch(`${base}/${exam.site.pages[0].file}`, { method: 'POST', body })).text();
        if (PHP_ERROR.test(html)) problems.push(`${r.widget.id} (POST): ${html.match(/.*(Warning|Fatal error|Parse error|Notice|Deprecated|Uncaught).*/)[0].slice(0, 200)}`);
        if (r.widget.id === 'phpUpdateForm' && !html.includes('Zaktualizowano rekord')) problems.push('phpUpdateForm: brak potwierdzenia');
        if (r.widget.id === 'phpSearchLike' && (html.match(/<tr>/g) || []).length < 2) problems.push('phpSearchLike: brak wyników wyszukiwania');
        if (r.widget.id === 'phpInsertForm' && !html.includes('Dodano rekord')) problems.push('phpInsertForm: brak potwierdzenia dodania rekordu');
        if (r.widget.id === 'phpSelectDetail') {
          const det = r.out.preview.match(/<p>([^<]+)<\/p>/);
          if (det && !html.includes(det[1].split(',')[0])) problems.push(`phpSelectDetail: brak danych rekordu w odpowiedzi (${det[1]})`);
        }
      }
      // Druga strona z parametrem GET
      const links = exam.site.rendered.find((r) => r.widget.id === 'phpLinksDetail');
      if (links) {
        const id = links.state.detail.result.param.value;
        const html = await (await fetch(`${base}/${exam.site.pages[1].file}?id=${id}&nazwa=Test`)).text();
        if (PHP_ERROR.test(html)) problems.push(`${exam.site.pages[1].file}: błąd PHP`);
        if (!html.includes('<h2>Test</h2>')) problems.push(`${exam.site.pages[1].file}: brak nagłówka z nazwą`);
      }
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

let failed = 0;
let queriesChecked = 0;
for (let i = 0; i < COUNT; i++) {
  const mode = i % 3 === 2 ? 'client' : 'server';
  const exam = generateExam({ seed: `INT${i}`, mode, difficulty: ['easy', 'normal', 'hard'][i % 3] });
  const problems = [];
  const db = exam.theme.dbName;
  const importDb = () => {
    mysql(`DROP DATABASE IF EXISTS ${db}; CREATE DATABASE ${db} CHARACTER SET utf8mb4 COLLATE utf8mb4_polish_ci;`);
    try {
      mysql(exam.dump, db);
    } catch (e) {
      problems.push(`import: ${e.stderr}`);
    }
  };
  importDb();
  if (exam.mode === 'server') {
    await checkPhp(exam, problems);
    importDb(); // formularze PHP mogły dodać rekordy - kwerendy sprawdzamy na świeżych danych
  }
  for (const q of exam.queries) {
    if (q.spec.kind === 'createUser') mysql(`DROP USER IF EXISTS '${q.spec.user}'@'localhost';`);
    try {
      const out = mysql(q.sql, db);
      queriesChecked++;
      if (q.spec.kind === 'select') {
        const diff = compareSelect(q, out);
        if (diff) problems.push(`Zapytanie ${q.number} (${q.pattern}): ${diff}\n  ${q.sql.replace(/\n/g, ' ')}`);
      }
    } catch (e) {
      problems.push(`Zapytanie ${q.number} (${q.pattern}) błąd SQL: ${String(e.stderr).trim()}\n  ${q.sql.replace(/\n/g, ' ')}`);
    }
  }
  if (problems.length) {
    failed++;
    console.log(`✗ ${exam.code} seed=${exam.seed} ${exam.theme.id}/${exam.mode}\n  ${problems.join('\n  ')}`);
  } else {
    console.log(`✓ ${exam.code} seed=${exam.seed} ${exam.theme.id}/${exam.mode} (${exam.queries.length} kwerend, ${exam.site.scripts.length} skryptów)`);
  }
}
console.log(`\nArkusze: ${COUNT}, z błędami: ${failed}, sprawdzonych kwerend: ${queriesChecked}`);
process.exit(failed ? 1 : 0);
