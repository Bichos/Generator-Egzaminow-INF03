// Orkiestrator: z ustawień i ziarna (seed) tworzy kompletny model arkusza egzaminacyjnego INF.03:
// treść zadania, bazę danych, rozwiązanie wzorcowe oraz kryteria oceniania.
import { Rng } from './rng.js';
import { THEMES, getTheme } from './themes.js';
import { buildDatabase, buildDump, schemaSvg } from './db.js';
import { schemaInfo } from './queries.js';
import { toSql, describe, execute } from './sql.js';
import { buildSite, pageHtml, layoutSvg } from './site.js';
import { buildCss, tagOnlyNote } from './css.js';
import { buildGraphics, buildAnimation } from './graphics.js';

export const MODES = {
  server: 'Baza danych + skrypty PHP (styczeń)',
  client: 'Baza danych + skrypty JavaScript (czerwiec)',
  animation: 'Animacja GIF + skrypty JavaScript',
};

export const DEFAULTS = { theme: 'random', mode: 'random', difficulty: 'normal', queryCount: 'auto', graphics: 'random', year: 2026, month: '06' };

export function randomSeed() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function makePassword(theme, rng) {
  const base = rng.pick(theme.passWords);
  const sym = rng.pick(['!', '#', '@', '%', '^', '*', '+', '$']);
  return rng.chance(0.5) ? `${base}${sym}${rng.int(1, 99)}` : `${sym}${base}${rng.int(10, 99)}`;
}

export function generateExam(input = {}) {
  const opts = { ...DEFAULTS, ...input };
  const seed = String(opts.seed || randomSeed()).trim().toUpperCase();
  const rng = new Rng(`${seed}|${opts.theme}|${opts.mode}|${opts.difficulty}|${opts.queryCount}|${opts.graphics}`);

  const theme = opts.theme === 'random' ? rng.fork('theme').pick(THEMES) : getTheme(opts.theme);
  if (!theme) throw new Error(`Nieznany temat: ${opts.theme}`);
  const mode = opts.mode === 'random' ? rng.fork('mode').weighted([['server', 5], ['client', 4], ['animation', 1]]) : opts.mode;
  const difficulty = opts.difficulty;
  const hasDb = mode !== 'animation';
  const queryCount = opts.queryCount === 'auto' ? (difficulty === 'hard' ? 5 : rng.fork('qc').pick([4, 4, 5])) : Number(opts.queryCount);

  const db = buildDatabase(theme, rng.fork('db'));
  const ctx = { theme, db, rng: rng.fork('site'), S: schemaInfo(theme) };
  const animation = mode === 'animation' ? buildAnimation(theme, rng.fork('anim')) : null;
  const site = buildSite(ctx, { mode: mode === 'server' ? 'server' : 'client', difficulty, queryCount: hasDb ? queryCount : 0, animation });
  const css = buildCss(site, rng.fork('css'));
  const withGraphics = opts.graphics === 'random' ? rng.fork('gfx').chance(0.5) : Boolean(opts.graphics === true || opts.graphics === 'yes');
  const graphics = withGraphics ? buildGraphics(theme, rng.fork('gfx2'), site) : null;

  const taskNo = String(rng.fork('no').int(1, 12)).padStart(2, '0');
  const yy = String(opts.year).slice(-2);
  const code = `INF.03-${taskNo}-${yy}.${opts.month}-SG`;
  const screenshotFmt = rng.fork('fmt').pick([['PNG', 'png'], ['JPEG', 'jpg']]);
  const importFmt = rng.fork('fmt2').pick([['PNG', 'png'], ['JPEG', 'jpg']]);

  const queries = hasDb ? site.queries.map((ref) => {
    const spec = ref.result.spec;
    return {
      number: ref.number,
      pattern: ref.result.pattern,
      group: ref.result.group,
      usedBy: ref.usedBy,
      spec,
      sql: toSql(spec),
      text: describe(spec),
      result: execute(spec, db, { rng: rng.fork(`res${ref.number}`) }),
    };
  }) : [];

  const archive = { name: `pliki${rng.fork('arch').int(1, 25)}`, password: makePassword(theme, rng.fork('pass')) };

  // --- pliki wynikowe zdającego ---
  const imageFiles = collectImages(site, theme, graphics, animation);
  const resultFiles = [
    ...(hasDb ? [`import.${importFmt[1]}`, ...queries.map((x) => `kw${x.number}.${screenshotFmt[1]}`), 'kwerendy.txt'] : []),
    ...(animation ? [animation.file, 'parametry.jpg'] : []),
    ...site.pages.map((p) => p.file),
    'styl.css',
    ...(site.js ? ['skrypt.js'] : []),
    ...imageFiles,
    'przeglądarka.txt',
  ];
  const resultFilesSorted = [...new Set(resultFiles)].sort((a, b) => a.localeCompare(b, 'pl'));

  const results = [
    hasDb ? 'operacje na bazie danych' : 'animacja',
    'zawartość witryny internetowej',
    'działanie witryny internetowej',
    'styl CSS witryny internetowej',
    mode === 'server' ? (site.scripts.length > 1 ? 'skrypty połączenia z bazą' : 'skrypt połączenia z bazą') : (site.scripts.length > 1 ? 'skrypty' : 'skrypt'),
  ];

  const exam = {
    seed, options: opts, code, taskNo, theme, mode, difficulty, hasDb,
    archive, db, dump: buildDump(db), schemaSvg: schemaSvg(theme), queries,
    site, css, cssNote: tagOnlyNote(css.tagOnly), graphics, animation,
    screenshotFmt, importFmt,
    layoutSvg: layoutSvg(site),
    imageFiles, resultFiles: resultFilesSorted, results,
  };
  exam.solution = buildSolution(exam);
  exam.criteria = buildCriteria(exam);
  return exam;
}

function collectImages(site, theme, graphics, animation) {
  const set = new Set(site.files);
  if (graphics) graphics.files.forEach((f) => set.add(f));
  if (animation) set.delete(animation.file);
  return [...set];
}

function buildSolution(exam) {
  const { site, theme } = exam;
  const files = {};
  site.pages.forEach((p, i) => {
    files[p.file] = pageHtml(site, theme, { page: i });
  });
  files['styl.css'] = exam.css.css;
  if (site.js) files['skrypt.js'] = `${site.js}\n`;
  if (exam.hasDb) files['kwerendy.txt'] = exam.queries.map((x) => `-- Zapytanie ${x.number}\n${x.sql}`).join('\n\n') + '\n';
  files['przeglądarka.txt'] = 'Google Chrome\n';
  return files;
}

const flatten = (lines, prefix = '') => lines.flatMap((l) => (typeof l === 'string' ? [prefix + l] : [prefix + l.text, ...flatten(l.children || [], '   – ')]));

function buildCriteria(exam) {
  const { site, theme } = exam;
  const crit = [];
  if (exam.hasDb) {
    crit.push({
      result: 'operacje na bazie danych',
      items: [
        `Utworzona baza danych ${theme.dbName} z kodowaniem polskich znaków, zaimportowane wszystkie tabele z pliku ${theme.sqlFile} (zrzut import.${exam.importFmt[1]})`,
        ...exam.queries.map((x) => `Zapytanie ${x.number} poprawne i zapisane w kwerendy.txt, zrzut kw${x.number}.${exam.screenshotFmt[1]} zgodny z oczekiwanym wynikiem: ${x.sql.replace(/\n/g, ' ')}`),
      ],
    });
  } else {
    crit.push({ result: 'animacja', items: exam.animation.checks });
  }
  const content = [
    `Witryna składa się z plików: ${site.pages.map((p) => p.file).join(', ')}; zapisana w HTML5 z deklaracją języka polskiego i kodowania UTF-8`,
    `Tytuł strony ${theme.siteTitle}, poprawnie dołączony arkusz styl.css`,
    'Bloki zrealizowane semantycznymi znacznikami HTML5 zgodnie z ilustracją układu',
  ];
  for (const b of site.blocks) {
    const lines = site.rendered.filter((r) => r.block === b).flatMap((r) => flatten(r.out.lines));
    if (lines.length) content.push(`Blok ${site.defs[b].nom}: ${lines.join('; ')}`);
  }
  if (exam.graphics) exam.graphics.tasks.forEach((t) => content.push(`Grafika: ${t.check}`));
  crit.push({ result: 'zawartość witryny internetowej', items: content });
  crit.push({
    result: 'działanie witryny internetowej',
    items: [
      'Witryna wyświetla się w przeglądarce bez błędów, układ bloków zgodny z ilustracją',
      ...site.scripts.map((s) => `Skrypt ${s.number} działa: ${flatten(s.lines).join('; ')}`),
    ],
  });
  crit.push({ result: 'styl CSS witryny internetowej', items: [...exam.css.text, ...(exam.cssNote ? ['Reguły dla znaczników zdefiniowane wyłącznie selektorem znacznika'] : [])] });
  crit.push({
    result: exam.results[4],
    items: exam.mode === 'server'
      ? ['Połączenie z serwerem localhost, użytkownik root bez hasła, baza ' + theme.dbName, 'Zapytania wysyłane funkcją mysqli_query, wyniki pobierane w pętli (np. mysqli_fetch_row / mysqli_fetch_array)', 'Dane z formularzy/parametrów pobierane z $_POST / $_GET i sprawdzane funkcją isset', 'Połączenie zamykane funkcją mysqli_close', 'Znaczące nazwy zmiennych']
      : ['Skrypty po stronie klienta w języku JavaScript', 'Elementy pobierane metodami DOM (np. getElementById, querySelector)', 'Obsługa zdarzeń zgodna z treścią (onclick / oninput / load)', 'Znaczące nazwy zmiennych i funkcji'],
  });
  return crit;
}
