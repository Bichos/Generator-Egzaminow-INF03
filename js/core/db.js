// Generowanie zawartości bazy danych dla tematu: rekordy, zrzut SQL w stylu phpMyAdmin oraz diagram relacji.
import { FIRST_NAMES_F, FIRST_NAMES_M, LAST_NAMES } from './data.js';
import { escapeXml } from './util.js';

const pad = (n) => String(n).padStart(2, '0');
const toDate = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function randomDate(rng, [from, to]) {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return toDate(new Date(a + Math.floor(rng.next() * ((b - a) / 86400000 + 1)) * 86400000));
}

function randomPrice(rng, [min, max], type) {
  const scale = Number((/DECIMAL\(\d+,(\d+)\)/.exec(type) || [0, 2])[1]);
  if (max >= 200 && scale >= 2) return Number((rng.int(min, max) + (rng.chance(0.5) ? 0.99 : 0)).toFixed(2));
  return rng.float(min, max, scale); // zgodnie ze skalą kolumny DECIMAL
}

export function buildDatabase(theme, rng) {
  const data = {};
  for (const table of theme.tables) {
    const rows = [];
    const catQueues = {};
    for (let i = 0; i < table.rows; i++) {
      const female = rng.chance(0.5);
      const row = {};
      for (const col of table.columns) {
        row[col.name] = generateValue(col, i, rng, female, data, catQueues);
      }
      rows.push(row);
    }
    data[table.name] = rows;
  }
  return { theme, data };
}

function generateValue(col, i, rng, female, data, catQueues) {
  switch (col.role) {
    case 'pk':
      return i + 1;
    case 'name':
      return col.list[i % col.list.length] + (i >= col.list.length ? ` ${Math.floor(i / col.list.length) + 1}` : '');
    case 'cat': {
      // Najpierw każda wartość pojawia się co najmniej raz, potem losowo - zapytania z WHERE zawsze coś zwrócą.
      const q = (catQueues[col.name] ||= rng.shuffle(col.values));
      return q.length ? q.shift() : rng.pick(col.values);
    }
    case 'price':
      return randomPrice(rng, col.range, col.type);
    case 'num':
      return rng.int(col.range[0], col.range[1]);
    case 'date':
      return randomDate(rng, col.range);
    case 'file':
      return col.pattern.replace('{i}', i + 1);
    case 'first':
      if (col.list) return col.list[i % col.list.length];
      return rng.pick(female ? FIRST_NAMES_F : FIRST_NAMES_M);
    case 'last':
      if (col.list) return col.list[i % col.list.length];
      return rng.pick(LAST_NAMES)[female ? 1 : 0];
    case 'bool':
      return rng.chance(0.6) ? 1 : 0;
    case 'fk': {
      // Ostatni rekord tabeli nadrzędnej nigdy nie jest używany - zapytania typu NOT IN / LEFT JOIN mają wynik.
      const parent = data[col.ref];
      const usable = Math.max(1, parent.length - 1);
      const queue = (catQueues[`fk:${col.name}`] ||= rng.shuffle(parent.slice(0, usable).map((r) => r.id)));
      return queue.length ? queue.shift() : parent[rng.int(0, usable - 1)].id;
    }
    default:
      return null;
  }
}

export const sqlLiteral = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
};

export function columnDdl(col) {
  const parts = [`\`${col.name}\``, col.type];
  if (col.role === 'pk') parts.push('NOT NULL AUTO_INCREMENT');
  else if (col.role === 'fk') parts.push('NOT NULL');
  else parts.push('DEFAULT NULL');
  return parts.join(' ');
}

export function buildDump(db) {
  const { theme, data } = db;
  const out = [
    '-- Generator arkuszy INF.03 - zrzut bazy danych',
    `-- Baza danych: \`${theme.dbName}\``,
    '',
    'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";',
    'SET time_zone = "+00:00";',
    'SET NAMES utf8mb4;',
    '',
  ];
  for (const table of theme.tables) {
    const defs = table.columns.map((c) => `  ${columnDdl(c)}`);
    defs.push('  PRIMARY KEY (`id`)');
    for (const c of table.columns.filter((c) => c.role === 'fk')) {
      defs.push(`  KEY \`${c.name}\` (\`${c.name}\`)`);
    }
    out.push(`-- Struktura tabeli \`${table.name}\``, `CREATE TABLE \`${table.name}\` (`, defs.join(',\n'),
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_polish_ci;', '');
    const cols = table.columns.map((c) => `\`${c.name}\``).join(', ');
    const values = data[table.name].map((r) => `(${table.columns.map((c) => sqlLiteral(r[c.name])).join(', ')})`);
    out.push(`-- Zrzut danych tabeli \`${table.name}\``, `INSERT INTO \`${table.name}\` (${cols}) VALUES`, `${values.join(',\n')};`, '');
  }
  for (const table of theme.tables) {
    out.push(`ALTER TABLE \`${table.name}\` MODIFY \`id\` INT NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=${data[table.name].length + 1};`);
  }
  out.push('');
  for (const table of theme.tables) {
    for (const c of table.columns.filter((c) => c.role === 'fk')) {
      out.push(`ALTER TABLE \`${table.name}\` ADD CONSTRAINT \`fk_${table.name}_${c.name}\` FOREIGN KEY (\`${c.name}\`) REFERENCES \`${c.ref}\` (\`id\`);`);
    }
  }
  return `${out.join('\n')}\n`;
}

// Diagram w stylu widoku "Projektant" phpMyAdmin: tabele z kolumnami i liniami relacji.
export function schemaSvg(theme) {
  const W = 190, ROW = 19, HEAD = 26, GAP = 60;
  const boxes = theme.tables.map((t, i) => ({ t, x: 10 + i * (W + GAP), y: 10 + (i % 2) * 30 }));
  const height = Math.max(...boxes.map((b) => b.y + HEAD + b.t.columns.length * ROW)) + 20;
  const width = 20 + boxes.length * W + (boxes.length - 1) * GAP;
  const pos = (tableName, colName) => {
    const b = boxes.find((x) => x.t.name === tableName);
    const idx = b.t.columns.findIndex((c) => c.name === colName);
    return { b, y: b.y + HEAD + idx * ROW + ROW / 2 };
  };
  const lines = [];
  for (const b of boxes) {
    for (const c of b.t.columns.filter((c) => c.role === 'fk')) {
      const from = pos(b.t.name, c.name);
      const to = pos(c.ref, 'id');
      const leftToRight = to.b.x < from.b.x;
      const x1 = leftToRight ? from.b.x : from.b.x + W;
      const x2 = leftToRight ? to.b.x + W : to.b.x;
      const mid = (x1 + x2) / 2;
      lines.push(`<path d="M${x1} ${from.y} H${mid} V${to.y} H${x2}" fill="none" stroke="#555" stroke-width="1.5"/>`,
        `<circle cx="${x2}" cy="${to.y}" r="3" fill="#555"/>`);
    }
  }
  const tables = boxes.map(({ t, x, y }) => {
    const rows = t.columns.map((c, i) => {
      const ry = y + HEAD + i * ROW;
      const key = c.role === 'pk' ? '🔑 ' : c.role === 'fk' ? '# ' : '';
      return `<text x="${x + 8}" y="${ry + 14}" font-size="12">${key}${escapeXml(c.name)}</text>`
        + `<text x="${x + W - 8}" y="${ry + 14}" font-size="10" fill="#666" text-anchor="end">${escapeXml(c.type.toLowerCase())}</text>`;
    }).join('');
    const h = HEAD + t.columns.length * ROW;
    return `<g font-family="Arial, sans-serif"><rect x="${x}" y="${y}" width="${W}" height="${h}" fill="#fff" stroke="#333"/>`
      + `<rect x="${x}" y="${y}" width="${W}" height="${HEAD}" fill="#d9e3ef" stroke="#333"/>`
      + `<text x="${x + 8}" y="${y + 17}" font-size="13" font-weight="bold">${escapeXml(t.name)}</text>${rows}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${lines.join('')}${tables}</svg>`;
}
