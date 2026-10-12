// Testy jednostkowe rdzenia generatora (bez przeglądarki i bazy): npm test*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateExam } from '../js/core/exam.js';
import { THEMES } from '../js/core/themes.js';
import { Rng } from '../js/core/rng.js';
import { buildDatabase } from '../js/core/db.js';
import { execute, toSql, describe } from '../js/core/sql.js';
import { renderSheet } from '../js/core/sheet.js';
import { renderKey } from '../js/core/key.js';
import { createZip, crc32 } from '../js/core/zip.js';

const MODES = ['server', 'client', 'animation'];

test('ten sam seed i ustawienia dają identyczny arkusz', () => {
  const a = generateExam({ seed: 'POWTARZALNY', mode: 'server' });
  const b = generateExam({ seed: 'powtarzalny', mode: 'server' });
  assert.equal(renderSheet(a), renderSheet(b));
  assert.equal(a.dump, b.dump);
});

test('różne seedy dają różne arkusze', () => {
  const sheets = new Set(['A1', 'A2', 'A3', 'A4', 'A5'].map((seed) => renderSheet(generateExam({ seed }))));
  assert.equal(sheets.size, 5);
});

test('każdy temat i wariant generuje kompletny arkusz', () => {
  for (const theme of THEMES) {
    for (const mode of MODES) {
      const e = generateExam({ seed: `T-${theme.id}`, theme: theme.id, mode });
      assert.equal(e.theme.id, theme.id);
      assert.equal(e.results.length, 5, 'zawsze 5 ocenianych rezultatów');
      assert.ok(e.site.scripts.length >= 1, 'co najmniej jeden skrypt');
      assert.ok(e.css.rules.length >= 5, 'reguły CSS');
      assert.ok(e.solution['styl.css'].includes('{'));
      for (const p of e.site.pages) assert.ok(e.solution[p.file].includes('<!DOCTYPE html>'));
      if (mode === 'animation') {
        assert.equal(e.queries.length, 0);
        assert.ok(e.animation);
      } else {
        assert.ok(e.queries.length >= 4, 'co najmniej 4 kwerendy');
        e.queries.forEach((q, i) => {
          assert.equal(q.number, i + 1);
          assert.ok(q.sql.endsWith(';'));
          assert.ok(q.text.length > 20);
        });
      }
    }
  }
});

test('numery skryptów i zapytań w treści odwołują się do istniejących elementów', () => {
  for (let i = 0; i < 60; i++) {
    const e = generateExam({ seed: `REF${i}`, mode: MODES[i % 2] });
    const text = JSON.stringify(e.site.rendered.map((r) => r.out.lines)) + JSON.stringify(e.site.scripts);
    for (const m of text.matchAll(/skrypt(?:u)? (\d+)/g)) assert.ok(Number(m[1]) <= e.site.scripts.length, `skrypt ${m[1]}`);
    for (const m of text.matchAll(/zapytanie (\d+)/g)) assert.ok(Number(m[1]) <= e.queries.length, `zapytanie ${m[1]}`);
    e.site.scripts.forEach((s, idx) => assert.equal(s.number, idx + 1));
  }
});

test('zapytania używane przez skrypty zwracają dane', () => {
  for (let i = 0; i < 80; i++) {
    const e = generateExam({ seed: `DATA${i}`, mode: 'server' });
    for (const q of e.queries.filter((x) => x.usedBy && x.spec.kind === 'select')) {
      assert.ok(q.result.rows.length > 0, `${e.seed}: zapytanie ${q.number} (${q.pattern}) puste`);
    }
  }
});

test('silnik SQL: filtr, sortowanie, grupowanie, złączenie', () => {
  const theme = THEMES.find((t) => t.id === 'hotel');
  const db = buildDatabase(theme, new Rng('sql'));
  const pokoje = db.data.pokoje;
  const typ = pokoje[0].typ;
  const where = execute({ kind: 'select', from: 'pokoje', fields: [{ t: 'pokoje', c: 'nazwa' }], where: [{ t: 'pokoje', c: 'typ', op: '=', v: typ }] }, db);
  assert.equal(where.rows.length, pokoje.filter((p) => p.typ === typ).length);

  const sorted = execute({ kind: 'select', from: 'pokoje', fields: [{ t: 'pokoje', c: 'cena' }], orderBy: [{ t: 'pokoje', c: 'cena', dir: 'DESC' }], limit: 3 }, db);
  const top = pokoje.map((p) => p.cena).sort((a, b) => b - a).slice(0, 3).map((v) => v.toFixed(2));
  assert.deepEqual(sorted.rows.map((r) => r[0]), top);

  const grouped = execute({ kind: 'select', from: 'pokoje', fields: [{ t: 'pokoje', c: 'typ' }, { t: 'pokoje', c: '*', agg: 'COUNT', star: true, alias: 'liczba' }], groupBy: { t: 'pokoje', c: 'typ' } }, db);
  assert.equal(grouped.rows.reduce((s, r) => s + r[1], 0), pokoje.length);

  const joined = execute({ kind: 'select', from: 'rezerwacje', fields: [{ t: 'pokoje', c: 'nazwa' }], joins: [{ t: 'pokoje', lt: 'rezerwacje', lc: 'id_pokoj', rc: 'id' }] }, db);
  assert.equal(joined.rows.length, db.data.rezerwacje.length);
});

test('opis i SQL dla modyfikacji danych', () => {
  const spec = { kind: 'update', t: 'pokoje', set: [{ c: 'cena', factor: 1.1 }], where: [{ t: 'pokoje', c: 'typ', op: '=', v: 'rodzinny' }] };
  assert.equal(toSql(spec), "UPDATE pokoje\nSET cena = cena * 1.1\nWHERE typ = 'rodzinny';");
  assert.match(describe(spec), /zwiększające wartość pola cena o 10%/);
  const alias = toSql({ kind: 'select', from: 'pokoje', fields: [{ t: 'pokoje', c: 'cena', agg: 'AVG', alias: 'Średnia cena' }] });
  assert.match(alias, /AS `Średnia cena`/, 'aliasy ze spacją w backtickach (bezpieczne w napisach PHP)');
});

test('zasady oceniania w formacie R.x.y (5 rezultatów, liczba kryteriów jak w arkuszach CKE)', () => {
  for (let i = 0; i < 40; i++) {
    const e = generateExam({ seed: `KLUCZ${i}`, mode: MODES[i % 3] });
    const key = renderKey(e);
    for (const q of e.queries) assert.ok(key.includes(`Zapytanie ${q.number}`));
    assert.equal(e.criteria.length, 5);
    e.criteria.forEach((r, ri) => {
      assert.equal(r.id, `R.${ri + 1}`);
      r.items.forEach((it, ii) => assert.equal(it.id, `R.${ri + 1}.${ii + 1}`));
    });
    const total = e.criteria.reduce((n, r) => n + r.items.length, 0);
    assert.ok(total >= 25 && total <= 60, `liczba kryteriów ${total}`);
    if (e.hasDb) {
      const r1 = e.criteria[0].items.map((x) => x.text).join('\n');
      for (const q of e.queries) assert.ok(r1.includes(`Wykonane zapytanie ${q.number}`));
    }
  }
});

test('modyfikacje danych nie dotyczą dwukrotnie tej samej tabeli i nie usuwają tabel używanych przez witrynę', () => {
  for (let i = 0; i < 150; i++) {
    const e = generateExam({ seed: `MOD${i}`, mode: 'server', difficulty: 'hard', queryCount: '6' });
    const mods = e.queries.filter((q) => !['select'].includes(q.spec.kind) && !['createUser', 'grant'].includes(q.spec.kind));
    const targets = mods.map((q) => q.spec.t);
    assert.equal(new Set(targets).size, targets.length, `${e.seed}: ${targets}`);
    const siteTables = new Set(e.queries.filter((q) => q.usedBy).flatMap((q) => [q.spec.from, q.spec.t, ...(q.spec.joins || []).map((j) => j.t)]));
    for (const q of e.queries.filter((x) => ['dropTable', 'alterDrop'].includes(x.spec.kind))) assert.ok(!siteTables.has(q.spec.t), `${e.seed}: ${q.sql}`);
  }
});

test('ZIP: poprawne nagłówki i suma CRC', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const zip = createZip([{ name: 'a/ż.txt', data: 'zażółć' }]);
  const view = new DataView(zip.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint32(zip.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(zip.length - 22 + 10, true), 1);
});

test('plan zdjęć Pixabay: hasło, wymiary i format dla każdego obrazu', async () => {
  const { imagePlan, creditsText } = await import('../js/core/images.js');
  for (let i = 0; i < 30; i++) {
    const e = generateExam({ seed: `IMG${i}`, graphics: 'yes' });
    const plan = imagePlan(e);
    assert.deepEqual(plan.map((p) => p.file).sort(), [...new Set(e.imageFiles)].sort());
    for (const p of plan) {
      assert.ok(p.query.length > 1 && p.fallback.length > 1, p.file);
      assert.equal(p.mime, p.file.endsWith('.png') ? 'image/png' : 'image/jpeg');
      assert.ok(p.width > 0 && p.height > 0);
    }
    assert.deepEqual(imagePlan(generateExam({ seed: `IMG${i}`, graphics: 'yes' })), plan, 'powtarzalność');
  }
  const e = generateExam({ seed: 'IMGC' });
  assert.equal(creditsText(e), '');
  e.photos = { 'a.jpg': { credit: { user: 'Jan', pageURL: 'https://pixabay.com/photos/x-1/' } } };
  assert.match(creditsText(e), /a\.jpg: autor Jan, https:\/\/pixabay\.com\/photos\/x-1\//);
});

test('układy, techniki, wariant PHP + JS: kompletne strony bez powtórzonych identyfikatorów', async () => {
  const { LAYOUTS } = await import('../js/core/site.js');
  const { previewHtml } = await import('../js/core/sheet.js');
  for (let i = 0; i < 160; i++) {
    const e = generateExam({ seed: `LAY${i}`, mode: ['server', 'client', 'mixed', 'animation'][i % 4], layout: LAYOUTS[i % LAYOUTS.length].id, technique: ['float', 'flex', 'grid'][i % 3], responsive: i % 2 ? 'yes' : 'no', pseudo: 'extended', pageWidth: ['full', '1000', '1200'][i % 3] });
    for (const b of e.site.blocks) assert.ok(e.site.rendered.some((r) => r.block === b), `${e.seed}: pusty blok ${b}`);
    for (let p = 0; p < e.site.pages.length; p++) {
      const ids = [...previewHtml(e, p).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      const dup = ids.filter((x, k) => ids.indexOf(x) !== k);
      assert.deepEqual(dup, [], `${e.seed}: powtórzone id ${dup}`);
    }
    if (e.mode === 'mixed') assert.ok(e.site.scripts.some((s) => s.lang === 'php') && e.site.scripts.some((s) => s.lang === 'js'), `${e.seed}: PHP + JS`);
    const css = e.css.css;
    assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length, 'nawiasy w CSS');
    if (e.site.technique === 'grid') assert.match(css, /display: grid/);
    if (e.site.technique === 'flex') assert.match(css, /display: flex/);
    if (e.style.responsive) assert.match(css, /@media \(max-width: 800px\)/);
  }
});
