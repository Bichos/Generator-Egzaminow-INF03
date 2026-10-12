// Klucz dla nauczyciela: oczekiwane wyniki zapytań, kryteria oceniania i rozwiązanie wzorcowe.
import { escapeHtml as h } from './util.js';
import { wrapDocument } from './sheet.js';

export function resultTable(res, max = 12) {
  if (!res.columns) return `<p class="info">${h(res.info || '')}</p>`;
  const rows = res.rows.slice(0, max).map((r) => `<tr>${r.map((v) => `<td>${v === null ? '<i>NULL</i>' : h(v)}</td>`).join('')}</tr>`).join('');
  const more = res.rows.length > max ? `<tr><td colspan="${res.columns.length}" class="more">… łącznie wierszy: ${res.rows.length}</td></tr>` : '';
  return `<table class="res"><tr>${res.columns.map((c) => `<th>${h(c)}</th>`).join('')}</tr>${rows}${more}</table><p class="count">Liczba wierszy: ${res.rows.length}</p>`;
}

export function renderKey(exam) {
  const queries = exam.queries.map((x) => `<div class="q"><h4>Zapytanie ${x.number}${x.usedBy ? ` <span class="tag">używane przez skrypt</span>` : ''}</h4><pre>${h(x.sql)}</pre>${resultTable(x.result)}</div>`).join('');
  const total = exam.criteria.reduce((n, c) => n + c.items.length, 0);
  const crit = `<table class="zo"><tr><th>Lp.</th><th>Elementy podlegające ocenie / kryteria oceny</th><th>Pkt</th></tr>${exam.criteria.map((c) => `<tr class="res-head"><td>${c.id}</td><td><b>Rezultat ${c.id.slice(2)}: ${h(c.result)}</b>${c.notes.map((n) => `<p class="note">${h(n)}</p>`).join('')}</td><td>${c.items.length}</td></tr>${c.items.map((it) => `<tr><td>${it.id}</td><td><label><input type="checkbox"> ${h(it.text)}</label></td><td>1</td></tr>`).join('')}`).join('')}<tr class="sum"><td></td><td>Razem</td><td>${total}</td></tr></table>`;
  const files = Object.entries(exam.solution).map(([name, code]) => `<h4>${h(name)}</h4><pre>${h(code)}</pre>`).join('');
  const body = `<section class="page">
  <h1>Klucz i kryteria oceniania</h1>
  <p class="meta">${h(exam.code)} · seed <b>${h(exam.seed)}</b> · ${h(exam.theme.app)} · baza <b>${h(exam.theme.dbName)}</b> · archiwum ${h(exam.archive.name)} (hasło: <code>${h(exam.archive.password)}</code>)</p>
  ${exam.hasDb ? `<h2>Zapytania SQL i oczekiwane wyniki</h2><p class="small">Wyniki wyliczono na danych z pliku ${h(exam.theme.sqlFile)} dołączonego do arkusza. Dla zapytań losowych (RAND) wynik jest przykładowy.</p>${queries}` : ''}
  <h2>Zasady oceniania</h2><p class="small">Każde kryterium oceniane jest zero-jedynkowo (spełnione – 1 pkt).</p>${crit}
  <h2>Rozwiązanie wzorcowe</h2>${files}
</section>`;
  return wrapDocument(`${exam.code} – klucz`, body, KEY_CSS);
}

const KEY_CSS = `
* { box-sizing: border-box; }
html { background: #eef0f3; }
body { margin: 0; padding: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #111; line-height: 1.4; }
.page { background: #fff; max-width: 210mm; margin: 0 auto; padding: 16mm; box-shadow: 0 1px 6px rgba(0,0,0,.15); }
h1 { font-size: 16pt; margin: 0 0 6px; }
h2 { font-size: 13pt; border-bottom: 2px solid #333; padding-bottom: 3px; margin-top: 22px; }
h3 { font-size: 11pt; margin: 14px 0 4px; }
h4 { margin: 12px 0 4px; }
pre { background: #f5f5f7; border: 1px solid #ddd; padding: 8px; white-space: pre-wrap; word-break: break-word; font-size: 9pt; }
table.res { border-collapse: collapse; font-size: 9pt; margin: 4px 0; max-width: 100%; }
table.res th, table.res td { border: 1px solid #999; padding: 2px 6px; text-align: left; }
table.res th { background: #eee; }
.more, .count, .info, .small { font-size: 9pt; color: #444; }
.tag { font-size: 8pt; background: #e3ecff; color: #234; padding: 1px 6px; border-radius: 8px; font-weight: normal; }
.crit li { margin: 3px 0; }
table.zo { border-collapse: collapse; width: 100%; font-size: 9.5pt; }
table.zo th, table.zo td { border: 1px solid #999; padding: 4px 6px; vertical-align: top; text-align: left; }
table.zo td:first-child, table.zo td:last-child { white-space: nowrap; text-align: center; }
table.zo tr.res-head td { background: #eef2f7; }
table.zo tr.sum td { font-weight: bold; }
table.zo .note { font-size: 8.5pt; color: #444; margin: 3px 0 0; }
table.zo tr { break-inside: avoid; }
.meta { color: #333; }
@media print { html, body { background: #fff; padding: 0; } .page { box-shadow: none; padding: 0; } .q, table.res { break-inside: avoid; } }
@page { size: A4; margin: 14mm; }
`;
