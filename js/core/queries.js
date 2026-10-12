// Biblioteka wzorców zapytań. Każdy wzorzec na podstawie tematu i danych tworzy specyfikację zapytania
// (patrz sql.js). Wzorce są dobierane tak, by zestaw kwerend był zróżnicowany jak w arkuszach CKE:
// selekcja z warunkiem i sortowaniem, funkcje agregujące, relacje (JOIN), modyfikacja danych lub struktury.
import { execute } from './sql.js';

export function schemaInfo(theme) {
  const main = theme.tables.find((t) => t.main);
  const col = (t, role) => t && t.columns.find((c) => c.role === role);
  const cols = (t, role) => (t ? t.columns.filter((c) => c.role === role) : []);
  const fkTo = (t, ref) => t.columns.find((c) => c.role === 'fk' && c.ref === ref);
  const parentFk = main.columns.find((c) => c.role === 'fk');
  const parent = parentFk && theme.tables.find((t) => t.name === parentFk.ref);
  const child = theme.tables.find((t) => t !== main && fkTo(t, main.name));
  const others = theme.tables.filter((t) => t !== main);
  return { main, parent, parentFk, child, childFk: child && fkTo(child, main.name), others, col, cols };
}

const F = (t, c, extra = {}) => ({ t: t.name || t, c: c.name || c, ...extra });
export const label = (t) => t.columns.find((c) => c.role === 'name') || t.columns.find((c) => c.role === 'last')
  || t.columns.find((c) => !['pk', 'fk'].includes(c.role));
const displayCols = (t) => [label(t), ...t.columns.filter((c) => ['cat', 'price', 'num', 'date', 'first', 'last'].includes(c.role) && c !== label(t))];

function median(values) {
  const s = values.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
const roundNice = (v) => (v >= 100 ? Math.round(v / 10) * 10 : Math.round(v));

// ---------- wzorce ----------
// Każdy zwraca { spec, tags } lub null, gdy temat nie spełnia warunków wzorca.

export const PATTERNS = {
  filterCatSorted({ theme, db, rng, S }) {
    const t = S.main;
    const cat = S.col(t, 'cat');
    const sortCol = rng.pick([...S.cols(t, 'price'), ...S.cols(t, 'num')]);
    if (!cat || !sortCol) return null;
    const value = rng.pick(cat.values);
    const fields = [label(t), ...rng.sample(displayCols(t).slice(1).filter((c) => c !== cat), 2)];
    if (!fields.includes(sortCol)) fields.push(sortCol);
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: fields.map((c) => F(t, c)), where: [{ ...F(t, cat), op: '=', v: value }], orderBy: [{ ...F(t, sortCol), dir: rng.pick(['ASC', 'DESC']) }] },
      tags: ['table', 'filterCat'], param: { col: cat.name, values: cat.values, value },
    };
  },
  topN({ rng, S }) {
    const t = S.main;
    const sortCol = rng.pick([...S.cols(t, 'price'), ...S.cols(t, 'num')]);
    if (!sortCol) return null;
    const n = rng.pick([3, 5, 10]);
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, label(t)), F(t, sortCol)], orderBy: [{ ...F(t, sortCol), dir: 'DESC' }], limit: n },
      tags: ['table', 'list'],
    };
  },
  numCompare({ db, rng, S }) {
    const t = S.main;
    const c = rng.pick([...S.cols(t, 'num'), ...S.cols(t, 'price')]);
    if (!c) return null;
    const threshold = roundNice(median(db.data[t.name].map((r) => r[c.name])));
    const op = rng.pick(['>', '<', '>=', '<=']);
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, 'id'), F(t, label(t)), F(t, c)], where: [{ ...F(t, c), op, v: threshold }], orderBy: [{ ...F(t, label(t)), dir: 'ASC' }] },
      tags: ['table'],
    };
  },
  between({ db, rng, S }) {
    const t = S.main;
    const c = rng.pick([...S.cols(t, 'num'), ...S.cols(t, 'date')]);
    if (!c) return null;
    const vals = db.data[t.name].map((r) => r[c.name]).sort();
    const a = vals[Math.floor(vals.length * 0.25)];
    const b = vals[Math.floor(vals.length * 0.7)];
    if (a === b) return null;
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, label(t)), F(t, c)], where: [{ ...F(t, c), op: 'BETWEEN', v: a, v2: b }] },
      tags: ['table'],
    };
  },
  like({ db, rng, S }) {
    const t = S.main;
    const n = label(t);
    const names = db.data[t.name].map((r) => String(r[n.name]));
    const first = rng.pick(names)[0];
    const count = names.filter((x) => x[0].toLowerCase() === first.toLowerCase()).length;
    const fragment = count >= 2 ? `${first}%` : `%${rng.pick(['a', 'o', 'e', 'i'])}%`;
    const extra = S.col(t, 'price') || S.col(t, 'num');
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, n), ...(extra ? [F(t, extra)] : [])], where: [{ ...F(t, n), op: 'LIKE', v: fragment }] },
      tags: ['table', 'list'],
    };
  },
  distinctCat({ rng, S }) {
    const t = rng.pick([S.main, ...S.others].filter((x) => S.col(x, 'cat')));
    if (!t) return null;
    const c = S.col(t, 'cat');
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, distinct: true, fields: [F(t, c)], orderBy: [{ ...F(t, c), dir: 'ASC' }] },
      tags: ['list', 'single-col'],
    };
  },
  random({ rng, S }) {
    const t = S.main;
    const file = S.col(t, 'file');
    const price = S.col(t, 'price') || S.col(t, 'num');
    const n = rng.pick([2, 3]);
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, label(t)), ...(price ? [F(t, price)] : []), ...(file ? [F(t, file)] : [])], random: true, limit: n },
      tags: ['random', 'cards'],
    };
  },
  aggregateCat({ rng, S }) {
    const t = S.main;
    const p = S.col(t, 'price') || S.col(t, 'num');
    const cat = S.col(t, 'cat');
    if (!p || !cat) return null;
    const value = rng.pick(cat.values);
    const kinds = rng.sample([['AVG', 'Średnia'], ['MAX', 'Najwyższa'], ['MIN', 'Najniższa'], ['SUM', 'Suma']], 2);
    return {
      group: 'aggregate',
      spec: { kind: 'select', from: t.name, fields: kinds.map(([agg, al]) => F(t, p, { agg, alias: `${al} ${p.name.replace(/_/g, ' ')}` })), where: [{ ...F(t, cat), op: '=', v: value }] },
      tags: ['stat'],
    };
  },
  minMax({ rng, S }) {
    const t = rng.pick([S.main, ...S.others].filter((x) => S.col(x, 'num') || S.col(x, 'date')));
    const c = S.col(t, 'num') || S.col(t, 'date');
    return {
      group: 'aggregate',
      spec: { kind: 'select', from: t.name, fields: [F(t, c, { agg: 'MIN', alias: 'najmniej' }), F(t, c, { agg: 'MAX', alias: 'najwiecej' })] },
      tags: ['stat'],
    };
  },
  countWhere({ rng, S }) {
    const t = rng.pick([S.main, ...S.others].filter((x) => S.col(x, 'cat')));
    if (!t) return null;
    const c = S.col(t, 'cat');
    const value = rng.pick(c.values);
    return {
      group: 'aggregate',
      spec: { kind: 'select', from: t.name, fields: [{ t: t.name, c: '*', agg: 'COUNT', star: true, alias: 'liczba' }], where: [{ ...F(t, c), op: '=', v: value }] },
      tags: ['stat'],
    };
  },
  groupCount({ rng, S }) {
    const t = rng.pick([S.main, ...S.others].filter((x) => S.col(x, 'cat')));
    if (!t) return null;
    const c = S.col(t, 'cat');
    const desc = rng.chance(0.5);
    return {
      group: 'aggregate',
      spec: { kind: 'select', from: t.name, fields: [F(t, c), { t: t.name, c: '*', agg: 'COUNT', star: true, alias: 'liczba' }], groupBy: F(t, c), ...(desc ? { orderBy: [{ field: 1, dir: 'DESC' }] } : {}) },
      tags: ['table', 'stat-table'],
    };
  },
  groupAvg({ rng, S }) {
    const t = S.main;
    const c = S.col(t, 'cat');
    const p = S.col(t, 'price') || S.col(t, 'num');
    if (!c || !p) return null;
    const agg = rng.pick(['AVG', 'MAX', 'MIN']);
    const alias = { AVG: 'srednia', MAX: 'maksimum', MIN: 'minimum' }[agg];
    return {
      group: 'aggregate',
      spec: { kind: 'select', from: t.name, fields: [F(t, c), F(t, p, { agg, alias, ...(agg === 'AVG' ? { round: 2 } : {}) })], groupBy: F(t, c), orderBy: [{ field: 1, dir: 'DESC' }] },
      tags: ['table', 'stat-table'],
    };
  },
  joinParent({ rng, S }) {
    if (!S.parent) return null;
    const t = S.main;
    const p = S.parent;
    const pl = label(p);
    const fields = [F(t, label(t)), ...rng.sample(displayCols(t).slice(1), 1).map((c) => F(t, c)), F(p, pl)];
    const where = [];
    const pcat = S.col(p, 'cat');
    if (rng.chance(0.5)) {
      const c = S.col(t, 'cat');
      if (c) where.push({ ...F(t, c), op: '=', v: rng.pick(c.values) });
    } else if (pcat && rng.chance(0.5)) {
      where.push({ ...F(p, pcat), op: '=', v: rng.pick(pcat.values) });
      fields.push(F(p, pcat));
    }
    return {
      group: 'join',
      spec: { kind: 'select', from: t.name, fields, joins: [{ t: p.name, lt: t.name, lc: S.parentFk.name, rc: 'id' }], where },
      tags: ['table', 'join'],
    };
  },
  joinChild({ db, rng, S }) {
    if (!S.child) return null;
    const t = S.main;
    const c = S.child;
    const childCols = rng.sample(displayCols(c).filter((x) => x.role !== 'name'), 2);
    if (!childCols.length) return null;
    const ids = db.data[c.name].map((r) => r[S.childFk.name]);
    const id = rng.pick(ids);
    const byId = rng.chance(0.5);
    const where = byId ? [{ ...F(t, 'id'), op: '=', v: id }] : [];
    if (!byId) {
      const cc = S.col(c, 'cat');
      if (cc) where.push({ ...F(c, cc), op: '=', v: rng.pick(cc.values) });
    }
    return {
      group: 'join',
      spec: { kind: 'select', from: c.name, fields: [F(t, label(t)), ...childCols.map((x) => F(c, x))], joins: [{ t: t.name, lt: c.name, lc: S.childFk.name, rc: 'id' }], where },
      tags: ['table', 'join', ...(byId ? ['byParentId'] : [])], param: byId ? { col: 'id', value: id } : null,
    };
  },
  joinGroupCount({ rng, S }) {
    if (!S.child) return null;
    const t = S.main;
    const c = S.child;
    return {
      group: 'join',
      spec: { kind: 'select', from: t.name, fields: [F(t, label(t)), { t: c.name, c: 'id', agg: 'COUNT', alias: rng.pick(['liczba', 'ile']) }], joins: [{ t: c.name, lt: t.name, lc: 'id', rc: S.childFk.name }], groupBy: F(t, label(t)), orderBy: [{ field: 1, dir: 'DESC' }] },
      tags: ['table', 'join', 'stat-table'],
    };
  },
  leftJoin({ S }) {
    if (!S.child) return null;
    const t = S.main;
    const c = S.child;
    const cc = S.col(c, 'date') || S.col(c, 'num');
    if (!cc) return null;
    return {
      group: 'join',
      spec: { kind: 'select', from: t.name, fields: [F(t, label(t)), F(c, cc)], joins: [{ t: c.name, lt: t.name, lc: 'id', rc: S.childFk.name, type: 'LEFT' }], orderBy: [{ ...F(t, label(t)), dir: 'ASC' }] },
      tags: ['table', 'join'],
    };
  },
  notIn({ S }) {
    if (!S.child) return null;
    const t = S.main;
    return {
      group: 'join',
      spec: { kind: 'select', from: t.name, fields: [F(t, 'id'), F(t, label(t))], where: [{ ...F(t, 'id'), op: 'NOT IN', sub: { kind: 'select', from: S.child.name, fields: [F(S.child, S.childFk)] } }] },
      tags: ['table', 'list'],
    };
  },
  insertChild({ db, rng, S }) {
    const c = S.child || S.others[0];
    const values = {};
    for (const col of c.columns) {
      if (col.role === 'pk') continue;
      values[col.name] = sampleValue(col, db, rng);
    }
    return { group: 'dml', target: c.name, spec: { kind: 'insert', t: c.name, values }, tags: ['insert'] };
  },
  update({ rng, S }) {
    const t = S.main;
    const p = S.col(t, 'price');
    const cat = S.col(t, 'cat');
    if (!p || !cat) return null;
    const factor = rng.pick([1.05, 1.1, 1.2, 0.9, 0.85, 0.75]);
    return { group: 'dml', target: t.name, spec: { kind: 'update', t: t.name, set: [{ c: p.name, factor }], where: [{ ...F(t, cat), op: '=', v: rng.pick(cat.values) }] }, tags: ['update'] };
  },
  updateNum({ db, rng, S }) {
    const t = S.main;
    const n = S.col(t, 'num');
    if (!n) return null;
    const id = rng.pick(db.data[t.name]).id;
    return { group: 'dml', target: t.name, spec: { kind: 'update', t: t.name, set: [{ c: n.name, add: rng.pick([1, 5, 10]) }], where: [{ ...F(t, 'id'), op: '=', v: id }] }, tags: ['update'] };
  },
  delete({ db, rng, S }) {
    const c = S.child;
    if (!c) return null;
    const d = S.col(c, 'date');
    if (d) {
      const sorted = db.data[c.name].map((r) => r[d.name]).sort();
      return { group: 'dml', target: c.name, spec: { kind: 'delete', t: c.name, where: [{ ...F(c, d), op: '<', v: sorted[Math.floor(sorted.length / 4)] }] }, tags: ['delete'] };
    }
    return { group: 'dml', target: c.name, spec: { kind: 'delete', t: c.name, where: [{ ...F(c, 'id'), op: '=', v: rng.pick(db.data[c.name]).id }] }, tags: ['delete'] };
  },
  alterAdd({ rng, S }) {
    const t = rng.pick([S.main, ...S.others]);
    const opt = rng.pick([
      { c: 'opis', type: 'TEXT', typePl: 'tekstowego (TEXT)' },
      { c: 'ocena', type: 'INT', typePl: 'liczbowego całkowitego', notNull: true, def: 0 },
      { c: 'aktywny', type: 'BOOLEAN', typePl: 'logicznego', notNull: true, def: 1 },
      { c: 'uwagi', type: 'VARCHAR(100)', typePl: 'napisowego o długości maksymalnie 100 znaków' },
      { c: 'data_dodania', type: 'DATE', typePl: 'data' },
    ]);
    return { group: 'ddl', target: t.name, spec: { kind: 'alterAdd', t: t.name, ...opt }, tags: ['ddl'] };
  },
  alterModify({ rng, S }) {
    const t = S.main;
    const p = S.col(t, 'price');
    const n = S.col(t, 'name');
    if (p && rng.chance(0.6)) return { group: 'ddl', target: t.name, spec: { kind: 'alterModify', t: t.name, c: p.name, type: 'DECIMAL(10,2)', typePl: 'liczbę dziesiętną o 10 cyfrach, w tym 2 po przecinku', notNull: true }, tags: ['ddl'] };
    if (!n) return null;
    return { group: 'ddl', target: t.name, spec: { kind: 'alterModify', t: t.name, c: n.name, type: 'VARCHAR(120)', typePl: 'napis o maksymalnej długości 120 znaków', notNull: true }, tags: ['ddl'] };
  },
  createUser({ theme, rng, S }) {
    const user = rng.pick(['kierownik', 'operator', 'redaktor', 'sprzedawca', 'analityk']);
    const pass = `${user.slice(0, 1).toUpperCase()}${user.slice(1, 4)}!${rng.int(10, 99)}#`;
    const privs = rng.pick([['SELECT'], ['SELECT', 'INSERT'], ['SELECT', 'UPDATE'], ['SELECT', 'INSERT', 'UPDATE'], ['SELECT', 'INSERT', 'UPDATE', 'DELETE'], ['CREATE', 'ALTER', 'SELECT']]);
    const onTable = rng.chance(0.6);
    // Jak w arkuszach: często osobne zapytania CREATE USER i GRANT
    const grant = { kind: 'grant', user, privs, db: theme.dbName, t: onTable ? S.main.name : null };
    if (rng.chance(0.5)) return { group: 'admin', target: '@user', spec: { kind: 'createUser', user, pass }, then: { group: 'admin', target: '@grant', spec: grant, tags: ['admin'], pattern: 'grant' }, tags: ['admin'] };
    return { group: 'admin', target: '@user', spec: { kind: 'createUser', user, pass, privs, db: theme.dbName, t: onTable ? S.main.name : null }, tags: ['admin'] };
  },

  filterOr({ rng, S }) {
    const t = S.main;
    const cat = S.col(t, 'cat');
    if (!cat || cat.values.length < 3) return null;
    const [a, b] = rng.sample(cat.values, 2);
    const extra = rng.pick([...S.cols(t, 'price'), ...S.cols(t, 'num')]);
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, label(t)), F(t, cat), ...(extra ? [F(t, extra)] : [])], where: [{ or: [{ ...F(t, cat), op: '=', v: a }, { ...F(t, cat), op: '=', v: b }] }] },
      tags: ['table'],
    };
  },
  filterAnd({ db, rng, S }) {
    const t = S.main;
    const cat = S.col(t, 'cat');
    const n = rng.pick([...S.cols(t, 'price'), ...S.cols(t, 'num')]);
    if (!cat || !n) return null;
    const value = rng.pick(cat.values);
    const vals = db.data[t.name].filter((r) => r[cat.name] === value).map((r) => r[n.name]).sort((x, y) => x - y);
    if (vals.length < 2) return null;
    const threshold = roundNice(vals[0]);
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, 'id'), F(t, label(t)), F(t, n)], where: [{ ...F(t, cat), op: '=', v: value }, { ...F(t, n), op: '>', v: threshold }] },
      tags: ['table'],
    };
  },
  updateLiteral({ db, rng, S }) {
    const t = rng.pick([S.main, ...S.others].filter((x) => S.col(x, 'cat')));
    if (!t) return null;
    const c = S.col(t, 'cat');
    const row = rng.pick(db.data[t.name]);
    const v = rng.pick(c.values.filter((x) => x !== row[c.name])) || c.values[0];
    return { group: 'dml', target: t.name, spec: { kind: 'update', t: t.name, set: [{ c: c.name, v }], where: [{ ...F(t, 'id'), op: '=', v: row.id }] }, tags: ['update'] };
  },
  alterAddAfter({ rng, S }) {
    const t = S.main;
    const after = rng.pick(t.columns.filter((c) => !['pk', 'fk'].includes(c.role)));
    const opt = rng.pick([
      { c: 'promocja', type: 'BOOLEAN', typePl: 'logicznego' },
      { c: 'kod', type: 'VARCHAR(10)', typePl: 'napisowego o długości maksymalnie 10 znaków' },
      { c: 'data_zmiany', type: 'DATE', typePl: 'data' },
    ]);
    return { group: 'ddl', target: t.name, spec: { kind: 'alterAdd', t: t.name, ...opt, after: after.name }, tags: ['ddl'] };
  },
  alterDrop({ rng, S }) {
    const t = rng.pick(S.others);
    const c = rng.pick(t.columns.filter((x) => ['cat', 'num', 'bool', 'date'].includes(x.role)));
    if (!c) return null;
    return { group: 'ddl', target: t.name, spec: { kind: 'alterDrop', t: t.name, c: c.name }, tags: ['ddl'] };
  },
  createTable({ theme, rng }) {
    const opt = rng.pick([
      { t: 'newsletter', columns: [{ name: 'email', type: 'VARCHAR(100)', typePl: 'napis do 100 znaków', notNull: true }, { name: 'data_zapisu', type: 'DATE', typePl: 'data' }] },
      { t: 'promocje', columns: [{ name: 'nazwa', type: 'VARCHAR(50)', typePl: 'napis do 50 znaków' }, { name: 'rabat', type: 'INT', typePl: 'liczba całkowita', unsigned: true }, { name: 'koniec', type: 'DATE', typePl: 'data' }] },
      { t: 'pracownicy', columns: [{ name: 'imie', type: 'VARCHAR(30)', typePl: 'napis do 30 znaków' }, { name: 'nazwisko', type: 'VARCHAR(50)', typePl: 'napis do 50 znaków' }, { name: 'stanowisko', type: 'TEXT', typePl: 'tekst' }] },
      { t: 'uwagi', columns: [{ name: 'tresc', type: 'TEXT', typePl: 'tekst' }, { name: 'ocena', type: 'INT', typePl: 'liczba całkowita', unsigned: true }] },
    ]);
    if (theme.tables.some((x) => x.name === opt.t)) return null;
    const id = { name: 'id', type: 'INT', typePl: 'liczba całkowita', unsigned: rng.chance(0.5), pk: true, ai: true };
    return { group: 'ddl', target: opt.t, spec: { kind: 'createTable', t: opt.t, columns: [id, ...opt.columns] }, tags: ['ddl'] };
  },
  dropTable({ theme, S }) {
    const referenced = new Set(theme.tables.flatMap((t) => t.columns.filter((c) => c.role === 'fk').map((c) => c.ref)));
    const t = S.others.find((x) => !referenced.has(x.name));
    if (!t) return null;
    return { group: 'ddl', target: t.name, spec: { kind: 'dropTable', t: t.name }, tags: ['ddl'] };
  },

  // --- wzorce używane przez skrypty PHP ---
  likePrefix({ db, rng, S }) {
    const t = S.main;
    const n = label(t);
    const firsts = db.data[t.name].map((r) => String(r[n.name])[0]);
    const counts = firsts.reduce((m, ch) => m.set(ch, (m.get(ch) || 0) + 1), new Map());
    const letter = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const extra = rng.pick(displayCols(t).slice(1));
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, n), F(t, extra)], where: [{ ...F(t, n), op: 'LIKE', v: `${letter}%` }] },
      tags: ['search'], param: { col: n.name, value: letter },
    };
  },
  updateById({ db, rng, S }) {
    const t = S.main;
    const n = S.col(t, 'num') || S.col(t, 'price');
    if (!n) return null;
    const row = rng.pick(db.data[t.name]);
    return { group: 'dml', target: t.name, spec: { kind: 'update', t: t.name, set: [{ c: n.name, v: row[n.name] + 1 }], where: [{ ...F(t, 'id'), op: '=', v: row.id }] }, tags: ['updateForm'], param: { col: n.name, id: row.id } };
  },
  cards({ rng, S }) {
    const t = S.main;
    const file = S.col(t, 'file');
    const val = S.col(t, 'price') || S.col(t, 'num');
    const cat = S.col(t, 'cat');
    if (!val) return null;
    const fields = [...(file ? [F(t, file)] : []), F(t, label(t)), ...(cat ? [F(t, cat)] : []), F(t, val)];
    return { group: 'select', spec: { kind: 'select', from: t.name, fields, orderBy: [{ ...F(t, label(t)), dir: 'ASC' }], limit: rng.pick([4, 6]) }, tags: ['cards'] };
  },
  idName({ rng, S }) {
    const t = S.main;
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, 'id'), F(t, label(t))], ...(rng.chance(0.5) ? { orderBy: [{ ...F(t, label(t)), dir: 'ASC' }] } : {}) },
      tags: ['options'],
    };
  },
  byId({ db, rng, S }) {
    const t = S.main;
    const id = rng.pick(db.data[t.name]).id;
    const fields = [label(t), ...displayCols(t).slice(1, 3)];
    const p = S.col(t, 'price');
    if (p && !fields.includes(p)) fields.push(p);
    const file = S.col(t, 'file');
    if (file) fields.push(file);
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: fields.map((c) => F(t, c)), where: [{ ...F(t, 'id'), op: '=', v: id }] },
      tags: ['byId'], param: { col: 'id', value: id },
    };
  },
  gallery({ rng, S }) {
    const t = S.main;
    const file = S.col(t, 'file');
    if (!file) return null;
    const cat = S.col(t, 'cat');
    const where = cat && rng.chance(0.4) ? [{ ...F(t, cat), op: '=', v: rng.pick(cat.values) }] : [];
    return {
      group: 'select',
      spec: { kind: 'select', from: t.name, fields: [F(t, file), F(t, label(t))], where, ...(where.length ? {} : { limit: rng.pick([6, 8]) }) },
      tags: ['gallery'],
    };
  },
};

export function sampleValue(col, db, rng) {
  switch (col.role) {
    case 'fk': return rng.pick(db.data[col.ref].slice(0, -1)).id;
    case 'date': return rng.chance(0.4) ? { raw: 'CURDATE()', descPl: 'aktualna data (wstawiana automatycznie funkcją)', sample: new Date().toISOString().slice(0, 10) } : col.range[1];
    case 'num': return Math.round((col.range[0] + col.range[1]) / 2);
    case 'price': return Number(((col.range[0] + col.range[1]) / 2).toFixed(2));
    case 'cat': return rng.pick(col.values);
    case 'bool': return 1;
    case 'first': return rng.pick(['Anna', 'Jan', 'Ewa', 'Piotr']);
    case 'last': return rng.pick(['Nowak', 'Wójcik', 'Mazur']);
    case 'file': return col.pattern.replace('{i}', 'nowy');
    case 'name': return `Nowy ${col.label}`.slice(0, 30);
    default: return 'nowy';
  }
}

export function runPattern(name, ctx) {
  const result = PATTERNS[name](ctx);
  if (!result) return null;
  result.pattern = name;
  if (result.spec.kind === 'select') {
    const res = execute(result.spec, ctx.db, { rng: ctx.rng.fork('exec') });
    if (!res.rows.length) return null;
  }
  return result;
}

const STANDALONE_GROUPS = {
  select: ['filterCatSorted', 'topN', 'numCompare', 'between', 'like', 'distinctCat', 'random', 'filterOr', 'filterAnd'],
  aggregate: ['aggregateCat', 'minMax', 'countWhere', 'groupCount', 'groupAvg'],
  join: ['joinParent', 'joinChild', 'joinGroupCount', 'leftJoin', 'notIn'],
  modify: ['insertChild', 'update', 'updateNum', 'updateLiteral', 'delete', 'alterAdd', 'alterAddAfter', 'alterModify', 'alterDrop', 'createUser', 'createTable', 'dropTable'],
};

// Częstość wzorców w 550 przykładowych kwerendach z zasad oceniania arkuszy E.14/EE.09/INF.03 (2018-2026).
const WEIGHTS = {
  filterCatSorted: 6, numCompare: 5, topN: 3, like: 3, filterOr: 2, filterAnd: 3, between: 1, distinctCat: 1, random: 1,
  aggregateCat: 3, countWhere: 3, groupCount: 4, groupAvg: 2, minMax: 1,
  joinParent: 6, joinChild: 4, joinGroupCount: 2, leftJoin: 1, notIn: 1,
  insertChild: 6, update: 3, updateNum: 2, updateLiteral: 4, delete: 2, alterAdd: 4, alterAddAfter: 2, alterModify: 1, alterDrop: 2,
  createUser: 5, createTable: 2, dropTable: 1,
};

function weightedOrder(rng, names) {
  const pool = names.slice();
  const out = [];
  while (pool.length) {
    const pick = rng.weighted(pool.map((n) => [n, WEIGHTS[n] || 1]));
    out.push(pick);
    pool.splice(pool.indexOf(pick), 1);
  }
  return out;
}

// Dobiera zestaw zapytań samodzielnych (nieużywanych przez skrypty), uzupełniając te wymagane przez witrynę.
export function pickStandalone(ctx, count, existing, difficulty) {
  const out = [];
  const used = new Set(existing.map((e) => e.pattern));
  const touched = new Set(existing.filter((e) => e.target).map((e) => e.target));
  // Tabele używane przez skrypty witryny nie mogą być usuwane ani tracić kolumn.
  const siteTables = new Set(existing.flatMap((e) => [e.spec.from, e.spec.t, ...(e.spec.joins || []).map((j) => j.t)]).filter(Boolean));
  const destructive = (r) => ['dropTable', 'alterDrop'].includes(r.spec.kind) && siteTables.has(r.spec.t);
  const have = (g) => existing.concat(out).some((e) => e.group === g || (g === 'modify' && ['dml', 'ddl', 'admin'].includes(e.group)));
  const order = ['join', 'aggregate', 'select', 'modify'];
  if (difficulty === 'hard') order.splice(1, 0, 'join');
  const tryGroup = (g) => {
    for (const name of weightedOrder(ctx.rng, STANDALONE_GROUPS[g])) {
      if (used.has(name)) continue;
      const r = runPattern(name, ctx);
      if (!r) continue;
      // dwie modyfikacje tej samej tabeli mogłyby się wykluczać (np. DROP COLUMN i UPDATE tej kolumny)
      if ((r.target && touched.has(r.target)) || destructive(r)) continue;
      if (r.then && out.length + 2 > count) delete r.then;
      used.add(name);
      if (r.target) touched.add(r.target);
      out.push(r);
      if (r.then) {
        out.push(r.then);
        delete r.then;
      }
      return true;
    }
    return false;
  };
  for (const g of order) {
    if (out.length >= count) break;
    if (!have(g) || (g === 'join' && difficulty === 'hard')) tryGroup(g);
  }
  while (out.length < count) {
    if (!tryGroup(ctx.rng.pick(Object.keys(STANDALONE_GROUPS)))) {
      if (!Object.keys(STANDALONE_GROUPS).some(tryGroup)) break;
    }
  }
  return out;
}
