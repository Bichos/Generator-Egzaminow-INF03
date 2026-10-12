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

test('klucz zawiera wszystkie zapytania i 5 rezultatów oceny', () => {
  const e = generateExam({ seed: 'KLUCZ', mode: 'server' });
  const key = renderKey(e);
  for (const q of e.queries) assert.ok(key.includes(`Zapytanie ${q.number}`));
  assert.equal(e.criteria.length, 5);
});

test('ZIP: poprawne nagłówki i suma CRC', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const zip = createZip([{ name: 'a/ż.txt', data: 'zażółć' }]);
  const view = new DataView(zip.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint32(zip.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(zip.length - 22 + 10, true), 1);
});
