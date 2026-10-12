// Interfejs aplikacji: formularz ustawień, podgląd arkusza i eksport.
import { generateExam, randomSeed, MODES, DEFAULTS } from '../core/exam.js';
import { THEMES } from '../core/themes.js';
import { renderSheet, previewHtml } from '../core/sheet.js';
import { renderKey, resultTable } from '../core/key.js';
import { createZip } from '../core/zip.js';
import { buildPackageEntries, examFolderName } from '../core/package.js';
import { escapeHtml as h } from '../core/util.js';

const $ = (sel) => document.querySelector(sel);
const form = $('#settings');
const FIELDS = ['seed', 'theme', 'mode', 'difficulty', 'queryCount', 'graphics', 'month', 'year'];
const HASH_KEYS = { seed: 's', theme: 't', mode: 'm', difficulty: 'd', queryCount: 'q', graphics: 'g', month: 'mo', year: 'y' };
let current = null;
const blobUrls = new Set();

// ---------- formularz ----------

function fillSelects() {
  const theme = $('#theme');
  theme.innerHTML = `<option value="random">losowy</option>${THEMES.map((t) => `<option value="${t.id}">${h(t.app.charAt(0).toUpperCase() + t.app.slice(1))}</option>`).join('')}`;
  $('#mode').innerHTML += Object.entries(MODES).map(([k, v]) => `<option value="${k}">${h(v)}</option>`).join('');
}

function readForm() {
  const o = {};
  for (const f of FIELDS) o[f] = form.elements[f].value;
  o.seed = (o.seed || '').trim().toUpperCase() || randomSeed();
  o.year = Number(o.year) || DEFAULTS.year;
  return o;
}

function writeForm(o) {
  for (const f of FIELDS) if (o[f] !== undefined) form.elements[f].value = o[f];
}

function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const o = {};
  for (const [field, key] of Object.entries(HASH_KEYS)) if (params.has(key)) o[field] = params.get(key);
  return o;
}

function writeHash(o) {
  const params = new URLSearchParams();
  for (const [field, key] of Object.entries(HASH_KEYS)) params.set(key, o[field]);
  history.replaceState(null, '', `#${params}`);
}

// ---------- generowanie i widoki ----------

function blobUrl(html) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  blobUrls.add(url);
  return url;
}

function generate() {
  const opts = readForm();
  writeForm(opts);
  try {
    current = generateExam(opts);
  } catch (err) {
    console.error(err);
    toast(`Błąd generowania: ${err.message}`);
    return;
  }
  writeHash(opts);
  blobUrls.forEach((u) => URL.revokeObjectURL(u));
  blobUrls.clear();
  current.sheetHtml = renderSheet(current);
  current.keyHtml = renderKey(current);
  $('#examCode').textContent = current.code;
  renderSummary();
  $('#sheetFrame').src = blobUrl(current.sheetHtml);
  $('#keyFrame').src = blobUrl(current.keyHtml);
  renderSitePreview(0);
  renderDb();
  renderSolution(Object.keys(current.solution)[0]);
}

function renderSummary() {
  const e = current;
  const items = [
    ['Temat', e.theme.app],
    ['Wariant', MODES[e.mode]],
    ['Baza', e.hasDb ? e.theme.dbName : '—'],
    ['Zapytania', e.queries.length || '—'],
    ['Skrypty', e.site.scripts.length],
    ['Strony', e.site.pages.map((p) => p.file).join(', ')],
    ['Grafika', e.graphics ? 'tak' : e.animation ? 'animacja' : 'nie'],
  ];
  $('#summary').innerHTML = items.map(([k, v]) => `<span>${h(k)}: <b>${h(v)}</b></span>`).join('');
}

function renderSitePreview(page) {
  const sw = $('#pageSwitch');
  const pages = current.site.pages;
  sw.innerHTML = pages.length > 1 ? pages.map((p, i) => `<button type="button" data-page="${i}" aria-pressed="${i === page}">${h(p.file)}</button>`).join('') : '';
  $('#siteFrame').src = blobUrl(previewHtml(current, page));
}

function renderDb() {
  const e = current;
  if (!e.hasDb) {
    $('#dbView').innerHTML = '<p>W tym wariancie (animacja) zadanie nie zawiera operacji na bazie danych.</p>';
    return;
  }
  const queries = e.queries.map((x) => `<div class="q"><p><b>Zapytanie ${x.number}</b>${x.usedBy ? '<span class="tag">używane przez skrypt</span>' : ''}: ${h(x.text)}</p><pre>${h(x.sql)}</pre>${resultTable(x.result, 8)}</div>`).join('');
  const preview = e.theme.tables.map((t) => {
    const rows = e.db.data[t.name];
    return `<details><summary>Tabela ${h(t.name)} (${rows.length} rekordów)</summary><table><tr>${t.columns.map((c) => `<th>${h(c.name)}</th>`).join('')}</tr>${rows.map((r) => `<tr>${t.columns.map((c) => `<td>${h(r[c.name])}</td>`).join('')}</tr>`).join('')}</table></details>`;
  }).join('');
  $('#dbView').innerHTML = `<h3>Schemat bazy ${h(e.theme.dbName)}</h3><div class="schema">${e.schemaSvg}</div>
    ${preview}
    <h3>Zapytania i oczekiwane wyniki</h3>${queries}
    <h3>Plik ${h(e.theme.sqlFile)}</h3><details><summary>Pokaż zrzut SQL</summary><pre>${h(e.dump)}</pre></details>`;
}

function renderSolution(file) {
  const names = Object.keys(current.solution);
  $('#fileList').innerHTML = names.map((n) => `<li><button type="button" data-file="${h(n)}" aria-current="${n === file}">${h(n)}</button></li>`).join('');
  $('#codeBox').textContent = current.solution[file] || '';
}

// ---------- eksport ----------

function download(name, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// SVG -> PNG/JPEG przez canvas (obrazy zastępcze dla zdającego).
function renderImage(svg, fileName) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 440;
      const g = canvas.getContext('2d');
      const jpeg = /\.jpe?g$/i.test(fileName);
      if (jpeg) {
        g.fillStyle = '#fff';
        g.fillRect(0, 0, canvas.width, canvas.height);
      }
      g.drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return reject(new Error('Nie udało się utworzyć obrazu'));
        resolve(new Uint8Array(await blob.arrayBuffer()));
      }, jpeg ? 'image/jpeg' : 'image/png', 0.9);
    };
    img.onerror = () => reject(new Error(`Błąd obrazu ${fileName}`));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function downloadPackage() {
  const btn = $('#downloadZip');
  btn.disabled = true;
  try {
    const entries = await buildPackageEntries(current, renderImage);
    download(`${examFolderName(current)}.zip`, new Blob([createZip(entries)], { type: 'application/zip' }));
    toast('Pobrano paczkę z arkuszem, kluczem, materiałami i rozwiązaniem');
  } catch (err) {
    console.error(err);
    toast(`Błąd: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

async function downloadBatch() {
  const btn = $('#batchBtn');
  const count = Math.min(40, Math.max(2, Number($('#batchCount').value) || 10));
  btn.disabled = true;
  try {
    const base = readForm();
    const entries = [];
    const index = [];
    for (let i = 1; i <= count; i++) {
      const seed = `${base.seed}-${String(i).padStart(2, '0')}`;
      const exam = generateExam({ ...base, seed });
      entries.push(...await buildPackageEntries(exam, renderImage, 'zestaw/'));
      index.push(`${String(i).padStart(2, '0')}. ${exam.code}  seed ${seed}  ${exam.theme.app} (${exam.mode})`);
    }
    entries.push({ name: 'zestaw/LISTA.txt', data: index.join('\r\n') });
    download(`INF03_zestaw_${base.seed}.zip`, new Blob([createZip(entries)], { type: 'application/zip' }));
    toast(`Pobrano zestaw ${count} arkuszy`);
  } catch (err) {
    console.error(err);
    toast(`Błąd: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function selectTab(name) {
  document.querySelectorAll('.tabs [role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  document.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = p.dataset.panel !== name; });
}

// ---------- zdarzenia ----------

fillSelects();
writeForm({ ...DEFAULTS, seed: randomSeed(), ...readHash() });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  generate();
});
$('#newSeed').addEventListener('click', () => {
  form.elements.seed.value = randomSeed();
});
$('#randomize').addEventListener('click', () => {
  form.elements.seed.value = randomSeed();
  generate();
});
document.querySelector('.tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) selectTab(b.dataset.tab);
});
$('#pageSwitch').addEventListener('click', (e) => {
  const b = e.target.closest('[data-page]');
  if (b) renderSitePreview(Number(b.dataset.page));
});
$('#fileList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-file]');
  if (b) renderSolution(b.dataset.file);
});
$('#printBtn').addEventListener('click', () => {
  const frame = $('#sheetFrame');
  selectTab('sheet');
  frame.contentWindow.focus();
  frame.contentWindow.print();
});
$('#downloadSheet').addEventListener('click', () => download(`${examFolderName(current)}_arkusz.html`, current.sheetHtml, 'text/html'));
$('#downloadZip').addEventListener('click', downloadPackage);
$('#batchBtn').addEventListener('click', downloadBatch);
$('#copyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    toast('Skopiowano link do arkusza');
  } catch {
    toast(location.href);
  }
});
window.addEventListener('hashchange', () => {
  const o = readHash();
  if (o.seed && o.seed !== form.elements.seed.value) {
    writeForm(o);
    generate();
  }
});

generate();
