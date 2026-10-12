// Model zapytań SQL. Każde zapytanie jest opisane strukturą (spec), z której powstają:
//  - tekst SQL (MySQL/MariaDB) do pliku kwerendy.txt w rozwiązaniu,
//  - treść polecenia w języku polskim (do arkusza),
//  - oczekiwany wynik wyliczony na danych testowych (do klucza odpowiedzi i podglądu witryny).
import { sqlLiteral } from './db.js';
import { q, joinPl } from './util.js';

const AGG_PL = { AVG: 'średnią', MIN: 'najmniejszą wartość', MAX: 'największą wartość', SUM: 'sumę', COUNT: 'liczbę' };
const OP_PL = { '>': 'jest większe niż', '<': 'jest mniejsze niż', '>=': 'jest nie mniejsze niż', '<=': 'jest nie większe niż', '=': 'ma wartość', '<>': 'ma wartość różną od' };

// ---------- renderowanie SQL ----------

const qualified = (spec) => Boolean(spec.joins && spec.joins.length);
const colName = (spec, f) => (qualified(spec) ? `${f.t}.${f.c}` : f.c);
const aliasSql = (a) => (/^[a-z_][a-z0-9_]*$/i.test(a) ? a : `\`${a}\``);

function fieldSql(spec, f) {
  if (f.agg) {
    const inner = f.star ? '*' : `${f.distinct ? 'DISTINCT ' : ''}${colName(spec, f)}`;
    const expr = f.round !== undefined ? `ROUND(${f.agg}(${inner}), ${f.round})` : `${f.agg}(${inner})`;
    return f.alias ? `${expr} AS ${aliasSql(f.alias)}` : expr;
  }
  return f.alias ? `${colName(spec, f)} AS ${aliasSql(f.alias)}` : colName(spec, f);
}

function valueSql(v) {
  if (v && v.param) return v.param; // miejsce na wartość wstawianą przez skrypt (np. $id)
  if (v && v.raw) return v.raw;
  return sqlLiteral(v);
}

function condSql(spec, w) {
  const col = colName(spec, w);
  switch (w.op) {
    case 'BETWEEN':
      return `${col} BETWEEN ${valueSql(w.v)} AND ${valueSql(w.v2)}`;
    case 'NOT IN':
      return `${col} NOT IN (${toSql(w.sub, true)})`;
    case 'IN':
      return `${col} IN (${w.v.map(valueSql).join(', ')})`;
    case 'IS NULL':
      return `${col} IS NULL`;
    default:
      return `${col} ${w.op} ${valueSql(w.v)}`;
  }
}

export function toSql(spec, nested = false) {
  let sql;
  switch (spec.kind) {
    case 'select': {
      const parts = [`SELECT ${spec.distinct ? 'DISTINCT ' : ''}${spec.fields.map((f) => fieldSql(spec, f)).join(', ')}`, `FROM ${spec.from}`];
      for (const j of spec.joins || []) {
        parts.push(`${j.type === 'LEFT' ? 'LEFT JOIN' : 'JOIN'} ${j.t} ON ${j.lt}.${j.lc} = ${j.t}.${j.rc}`);
      }
      if (spec.where?.length) parts.push(`WHERE ${spec.where.map((w) => condSql(spec, w)).join(' AND ')}`);
      if (spec.groupBy) parts.push(`GROUP BY ${colName(spec, spec.groupBy)}`);
      if (spec.random) parts.push('ORDER BY RAND()');
      else if (spec.orderBy?.length) {
        parts.push(`ORDER BY ${spec.orderBy.map((o) => `${o.field !== undefined ? orderFieldSql(spec, o.field) : colName(spec, o)} ${o.dir}`).join(', ')}`);
      }
      if (spec.limit) parts.push(`LIMIT ${spec.limit}`);
      sql = parts.join(nested ? ' ' : '\n');
      break;
    }
    case 'insert': {
      const cols = Object.keys(spec.values);
      sql = `INSERT INTO ${spec.t} (${cols.join(', ')})\nVALUES (${cols.map((c) => valueSql(spec.values[c])).join(', ')})`;
      break;
    }
    case 'update': {
      const sets = spec.set.map((s) => `${s.c} = ${s.factor !== undefined ? `${s.c} * ${s.factor}` : s.add !== undefined ? `${s.c} + ${s.add}` : valueSql(s.v)}`);
      sql = `UPDATE ${spec.t}\nSET ${sets.join(', ')}${spec.where?.length ? `\nWHERE ${spec.where.map((w) => condSql(spec, w)).join(' AND ')}` : ''}`;
      break;
    }
    case 'delete':
      sql = `DELETE FROM ${spec.t}\nWHERE ${spec.where.map((w) => condSql(spec, w)).join(' AND ')}`;
      break;
    case 'alterAdd':
      sql = `ALTER TABLE ${spec.t}\nADD COLUMN ${spec.c} ${spec.type}${spec.notNull ? ' NOT NULL' : ''}${spec.def !== undefined ? ` DEFAULT ${sqlLiteral(spec.def)}` : ''}`;
      break;
    case 'alterModify':
      sql = `ALTER TABLE ${spec.t}\nMODIFY ${spec.c} ${spec.type}${spec.notNull ? ' NOT NULL' : ''}`;
      break;
    case 'alterDrop':
      sql = `ALTER TABLE ${spec.t}\nDROP COLUMN ${spec.c}`;
      break;
    case 'createUser':
      sql = `CREATE USER '${spec.user}'@'localhost' IDENTIFIED BY '${spec.pass}'`;
      if (spec.privs) sql += `;\nGRANT ${spec.privs.join(', ')} ON ${spec.db}.${spec.t || '*'} TO '${spec.user}'@'localhost'`;
      break;
    default:
      throw new Error(`Nieznany rodzaj zapytania: ${spec.kind}`);
  }
  return nested ? sql : `${sql};`;
}

// Zapytanie w jednej linii, bez średnika - do osadzenia w kodzie PHP.
export const toSqlInline = (spec) => toSql(spec, true).replace(/\n/g, ' ');

function orderFieldSql(spec, idx) {
  const f = spec.fields[idx];
  if (f.alias) return aliasSql(f.alias);
  return f.agg ? fieldSql(spec, f) : colName(spec, f);
}

// ---------- wykonywanie zapytań na danych testowych ----------

const norm = (v) => (typeof v === 'string' ? v.toLocaleLowerCase('pl') : v);
function compare(a, b) {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'pl', { sensitivity: 'base' });
}

function likeToRegex(pattern) {
  const body = pattern.split('').map((ch) => (ch === '%' ? '.*' : ch === '_' ? '.' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('');
  return new RegExp(`^${body}$`, 'iu');
}

function resolveValue(v, params) {
  if (v && v.param) return params?.[v.param] ?? v.sample;
  if (v && v.raw) return v.sample ?? null;
  return v;
}

function matches(row, w, db, params) {
  const val = row[w.t]?.[w.c];
  const v = resolveValue(w.v, params);
  switch (w.op) {
    case '=': return compare(norm(val), norm(v)) === 0;
    case '<>': return compare(norm(val), norm(v)) !== 0;
    case '>': return compare(val, v) > 0;
    case '<': return compare(val, v) < 0;
    case '>=': return compare(val, v) >= 0;
    case '<=': return compare(val, v) <= 0;
    case 'LIKE': return val !== null && likeToRegex(v).test(String(val));
    case 'BETWEEN': return compare(val, v) >= 0 && compare(val, resolveValue(w.v2, params)) <= 0;
    case 'IN': return w.v.some((x) => compare(norm(val), norm(x)) === 0);
    case 'IS NULL': return val === null || val === undefined;
    case 'NOT IN': {
      const sub = execute(w.sub, db, { params }).rows.map((r) => r[0]);
      return !sub.some((x) => compare(val, x) === 0);
    }
    default: throw new Error(`Operator ${w.op}`);
  }
}

function decimalScale(db, f) {
  const col = db.theme.tables.find((t) => t.name === f.t)?.columns.find((c) => c.name === f.c);
  const m = col && /DECIMAL\(\d+,(\d+)\)/.exec(col.type);
  return m ? Number(m[1]) : 0;
}

function formatDecimal(db, f, v) {
  if (typeof v !== 'number') return v;
  const scale = decimalScale(db, f);
  return scale ? v.toFixed(scale) : v;
}

function aggregate(f, group, db) {
  const vals = f.star ? group : group.map((r) => r[f.t]?.[f.c]).filter((v) => v !== null && v !== undefined);
  const distinct = f.distinct ? [...new Set(vals)] : vals;
  let result;
  switch (f.agg) {
    case 'COUNT': return distinct.length;
    case 'SUM': result = distinct.reduce((s, v) => s + Number(v), 0); break;
    case 'MIN': return distinct.length ? formatDecimal(db, f, distinct.reduce((m, v) => (compare(v, m) < 0 ? v : m))) : null;
    case 'MAX': return distinct.length ? formatDecimal(db, f, distinct.reduce((m, v) => (compare(v, m) > 0 ? v : m))) : null;
    case 'AVG': {
      if (!distinct.length) return null;
      const avg = distinct.reduce((s, v) => s + Number(v), 0) / distinct.length;
      // MySQL zwraca średnią z dokładnością skali kolumny + 4 miejsca po przecinku
      const scale = f.round !== undefined ? f.round : decimalScale(db, f) + 4;
      return Number(avg.toFixed(scale)).toFixed(scale);
    }
    default: throw new Error(f.agg);
  }
  if (f.round !== undefined) return Number(result.toFixed(f.round));
  const scale = decimalScale(db, f);
  return scale ? result.toFixed(scale) : result;
}

export function fieldHeader(spec, f) {
  if (f.alias) return f.alias;
  if (f.agg) return fieldSql(spec, f);
  return f.c;
}

export function execute(spec, db, { params, rng } = {}) {
  if (spec.kind !== 'select') return executeModification(spec, db, params);
  let rows = db.data[spec.from].map((r) => ({ [spec.from]: r }));
  for (const j of spec.joins || []) {
    const next = [];
    for (const row of rows) {
      const found = db.data[j.t].filter((x) => compare(x[j.rc], row[j.lt]?.[j.lc]) === 0);
      if (found.length) found.forEach((x) => next.push({ ...row, [j.t]: x }));
      else if (j.type === 'LEFT') next.push({ ...row, [j.t]: null });
    }
    rows = next;
  }
  rows = rows.filter((row) => (spec.where || []).every((w) => matches(row, w, db, params)));

  const grouped = spec.groupBy || spec.fields.some((f) => f.agg);
  let out;
  if (grouped) {
    const groups = new Map();
    for (const row of rows) {
      const key = spec.groupBy ? norm(row[spec.groupBy.t]?.[spec.groupBy.c]) : '*';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    if (!spec.groupBy && !groups.size) groups.set('*', []);
    out = [...groups.values()].map((g) => spec.fields.map((f) => (f.agg ? aggregate(f, g, db) : formatDecimal(db, f, g[0]?.[f.t]?.[f.c] ?? null))));
    if (spec.groupBy && !spec.orderBy?.length) {
      out.sort((a, b) => compare(a[spec.fields.findIndex((f) => f.c === spec.groupBy.c && !f.agg)], b[spec.fields.findIndex((f) => f.c === spec.groupBy.c && !f.agg)]));
    }
    if (spec.orderBy?.length) {
      out.sort((a, b) => {
        for (const o of spec.orderBy) {
          const idx = o.field !== undefined ? o.field : spec.fields.findIndex((f) => f.t === o.t && f.c === o.c);
          const d = compare(numOrStr(a[idx]), numOrStr(b[idx])) * (o.dir === 'DESC' ? -1 : 1);
          if (d) return d;
        }
        return 0;
      });
    }
  } else {
    if (spec.random && rng) rows = rng.shuffle(rows);
    else if (spec.orderBy?.length) {
      rows = rows.slice().sort((a, b) => {
        for (const o of spec.orderBy) {
          const f = o.field !== undefined ? spec.fields[o.field] : o;
          const d = compare(a[f.t]?.[f.c], b[f.t]?.[f.c]) * (o.dir === 'DESC' ? -1 : 1);
          if (d) return d;
        }
        return 0;
      });
    }
    out = rows.map((row) => spec.fields.map((f) => formatDecimal(db, f, row[f.t]?.[f.c] ?? null)));
  }
  if (spec.distinct) {
    const seen = new Set();
    out = out.filter((r) => {
      const k = JSON.stringify(r.map(norm));
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  if (spec.limit) out = out.slice(0, spec.limit);
  return { columns: spec.fields.map((f) => fieldHeader(spec, f)), rows: out };
}

const numOrStr = (v) => (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v);

function executeModification(spec, db, params) {
  switch (spec.kind) {
    case 'insert': return { affected: 1, info: `Wstawiono 1 wiersz do tabeli ${spec.t}.` };
    case 'update':
    case 'delete': {
      const n = db.data[spec.t].filter((r) => (spec.where || []).every((w) => matches({ [spec.t]: r }, { ...w, t: spec.t }, db, params))).length;
      return { affected: n, info: `${spec.kind === 'update' ? 'Zmodyfikowano' : 'Usunięto'} wierszy: ${n} (tabela ${spec.t}).` };
    }
    case 'alterAdd': return { info: `Tabela ${spec.t} ma nową kolumnę ${spec.c}.` };
    case 'alterModify': return { info: `Kolumna ${spec.t}.${spec.c} ma typ ${spec.type}.` };
    case 'alterDrop': return { info: `Z tabeli ${spec.t} usunięto kolumnę ${spec.c}.` };
    case 'createUser': return { info: `Utworzono użytkownika ${spec.user}@localhost.` };
    default: return { info: '' };
  }
}

// ---------- opis polecenia po polsku ----------

const fieldsPl = (fs) => joinPl(fs.map((f) => f.c));

const isDate = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const DATE_OP_PL = { '>': 'jest późniejsze niż', '<': 'jest wcześniejsze niż', '>=': 'jest nie wcześniejsze niż', '<=': 'jest nie późniejsze niż' };

function condPl(w, spec) {
  const v = (x) => (x && x.desc) || (typeof x === 'string' ? q(x) : x);
  const col = spec && qualified(spec) ? `${w.t}.${w.c}` : w.c;
  w = { ...w, c: col };
  if (isDate(w.v) && DATE_OP_PL[w.op]) return `pole ${w.c} ${DATE_OP_PL[w.op]} ${v(w.v)}`;
  switch (w.op) {
    case 'LIKE': {
      const p = w.v;
      if (p.startsWith('%') && p.endsWith('%')) return `pole ${w.c} zawiera fragment ${q(p.slice(1, -1))}`;
      if (p.endsWith('%')) return `pole ${w.c} rozpoczyna się od ${q(p.slice(0, -1))}`;
      return `pole ${w.c} kończy się na ${q(p.slice(1))}`;
    }
    case 'BETWEEN': return `pole ${w.c} mieści się w przedziale od ${v(w.v)} do ${v(w.v2)} (włącznie)`;
    case 'IN': return `pole ${w.c} ma jedną z wartości: ${w.v.map(v).join(', ')}`;
    case 'NOT IN': return `${w.c} nie występuje w tabeli ${w.sub.from} (w polu ${w.sub.fields[0].c})`;
    case 'IS NULL': return `pole ${w.c} jest puste (NULL)`;
    default: return `pole ${w.c} ${OP_PL[w.op]} ${v(w.v)}`;
  }
}

export function describe(spec) {
  if (spec.desc) return spec.desc;
  switch (spec.kind) {
    case 'select': return describeSelect(spec);
    case 'insert': {
      const vals = Object.entries(spec.values).map(([c, v]) => `${c}: ${v && v.raw ? v.descPl : typeof v === 'string' ? q(v) : v}`);
      return `wstawiające do tabeli ${spec.t} rekord o wartościach – ${vals.join(', ')}. Klucz główny nadawany jest automatycznie`;
    }
    case 'update': {
      const s = spec.set[0];
      const change = s.factor !== undefined
        ? (s.factor > 1 ? `zwiększające wartość pola ${s.c} o ${Math.round((s.factor - 1) * 100)}%` : `zmniejszające wartość pola ${s.c} o ${Math.round((1 - s.factor) * 100)}%`)
        : s.add !== undefined ? `zwiększające wartość pola ${s.c} o ${s.add}` : `ustawiające w polu ${s.c} wartość ${typeof s.v === 'string' ? q(s.v) : s.v}`;
      return `${change} w tabeli ${spec.t}${spec.where?.length ? ` dla rekordów, w których ${spec.where.map((w) => condPl(w, spec)).join(' oraz ')}` : ' dla wszystkich rekordów'}`;
    }
    case 'delete':
      return `usuwające z tabeli ${spec.t} rekordy, w których ${spec.where.map((w) => condPl(w, spec)).join(' oraz ')}`;
    case 'alterAdd':
      return `modyfikujące strukturę tabeli ${spec.t} poprzez dodanie kolumny o nazwie ${spec.c} typu ${spec.typePl || spec.type}${spec.notNull ? ', kolumna nie może być pusta' : ''}${spec.def !== undefined ? `, wartość domyślna ${spec.def}` : ''}`;
    case 'alterModify':
      return `zmieniające strukturę tabeli ${spec.t} poprzez zmianę typu kolumny ${spec.c} na ${spec.typePl || spec.type}`;
    case 'alterDrop':
      return `usuwające z tabeli ${spec.t} kolumnę ${spec.c}`;
    case 'createUser':
      return `tworzące nowego użytkownika lokalnego (localhost) o nazwie ${spec.user} i haśle ${spec.pass}${spec.privs ? `, a następnie nadające mu prawa ${joinPl(spec.privs)} do tabeli ${spec.t} w bazie ${spec.db}` : ''}`;
    default: return '';
  }
}

function describeSelect(spec) {
  const plain = spec.fields.filter((f) => !f.agg);
  const aggs = spec.fields.filter((f) => f.agg);
  const parts = [];
  if (spec.joins?.length) {
    const byTable = new Map();
    for (const f of plain) {
      if (!byTable.has(f.t)) byTable.set(f.t, []);
      byTable.get(f.t).push(f);
    }
    const chunks = [...byTable.entries()].map(([t, fs], i) => (i === 0
      ? `z tabeli ${t} jedynie pola ${fieldsPl(fs)}`
      : `odpowiadające im z tabeli ${t} pol${fs.length > 1 ? 'a' : 'e'} ${fieldsPl(fs)}`));
    parts.push(`wybierające ${chunks.join(' oraz ')}`);
  } else if (plain.length) {
    parts.push(`wybierające ${spec.distinct ? 'bez powtórzeń ' : ''}jedynie pol${plain.length > 1 ? 'a' : 'e'} ${fieldsPl(plain)} z tabeli ${spec.from}`);
  }
  if (aggs.length) {
    const a = aggs.map((f) => {
      const what = f.star ? 'liczbę rekordów' : `${AGG_PL[f.agg]} ${f.agg === 'COUNT' ? `wartości pola ${f.c}` : `pola ${f.c}`}`;
      return `${what}${f.round !== undefined ? ` zaokrągloną do ${f.round} miejsc po przecinku` : ''}${f.alias ? ` (nazwa kolumny – alias ${q(f.alias)})` : ''}`;
    });
    parts.push(`${plain.length ? 'oraz obliczające' : `obliczające${spec.joins?.length ? '' : ` dla tabeli ${spec.from}`}`} ${joinPl(a)}`);
  }
  let text = parts.join(' ');
  if (spec.groupBy) text += `, zgrupowane według pola ${spec.groupBy.c}`;
  if (spec.where?.length) text += `, dla rekordów, w których ${spec.where.map((w) => condPl(w, spec)).join(' oraz ')}`;
  if (spec.random) text += `. Rekordy są wybierane losowo, wybierane są ${spec.limit} rekordy`;
  else {
    if (spec.orderBy?.length) {
      text += `, posortowane ${spec.orderBy.map((o) => `${o.dir === 'DESC' ? 'malejąco' : 'rosnąco'} według ${o.field !== undefined ? (spec.fields[o.field].alias ? `kolumny ${q(spec.fields[o.field].alias)}` : `pola ${spec.fields[o.field].c}`) : `pola ${o.c}`}`).join(', a następnie ')}`;
    }
    if (spec.limit) text += `. Należy wybrać jedynie ${spec.limit === 1 ? 'jeden rekord' : spec.limit < 5 ? `${spec.limit} pierwsze rekordy` : `${spec.limit} pierwszych rekordów`}`;
  }
  if (spec.joins?.length) text += `. Należy posłużyć się relacją${spec.joins.some((j) => j.type === 'LEFT') ? ' i odpowiednim rodzajem złączenia (uwzględnione są także rekordy bez dopasowania)' : ''}`;
  if (spec.note) text += `. ${spec.note}`;
  return text;
}
