// Test skryptów JavaScript rozwiązań wzorcowych w przeglądarce (Playwright + Chromium).
// Dla losowych arkuszy w wariantach JS ładuje podgląd strony, wykonuje akcje użytkownika
// i sprawdza efekt każdego skryptu oraz brak błędów w konsoli.
// Uruchomienie: NODE_PATH=$(npm root -g) node tests/browser.mjs [liczba_arkuszy]
import { createRequire } from 'node:module';
import { generateExam } from '../js/core/exam.js';
import { previewHtml } from '../js/core/sheet.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const COUNT = Number(process.argv[2] || 30);

const CHECKS = {
  async jsCalculator(page) {
    await page.fill('#liczba', '6');
    await page.click('button[onclick="oblicz()"]');
    const t = await page.textContent('#wynik');
    if (!/^Koszt: \d+\.\d{2} zł$/.test(t)) return `kalkulator: "${t}"`;
    await page.fill('#liczba', '0');
    await page.click('button[onclick="oblicz()"]');
    if ((await page.textContent('#wynik')) !== 'Podaj poprawną liczbę') return 'kalkulator: brak komunikatu o błędnej liczbie';
    return null;
  },
  async jsSlider(page) {
    await page.$eval('#suwak', (el) => { el.value = el.max; el.dispatchEvent(new Event('input')); });
    const max = await page.$eval('#suwak', (el) => el.max);
    const t = await page.textContent('#opisSuwaka');
    return t.includes(max) ? null : `suwak: "${t}"`;
  },
  async jsDate(page) {
    const t = await page.textContent('#data');
    return /\d{2}[./-]\d{2}[./-]\d{4}|\d{4}-\d{2}-\d{2}/.test(t) ? null : `data: "${t}"`;
  },
  async jsThumbs(page) {
    const thumbs = await page.$$('img[onclick]');
    await thumbs[thumbs.length - 1].click();
    const [big, last] = await Promise.all([page.$eval('#duzy', (e) => e.src), thumbs[thumbs.length - 1].evaluate((e) => e.src)]);
    return big === last ? null : 'miniatury: duży obraz nie zmienił się';
  },
  async jsToggle(page) {
    await page.click('#przelacznik');
    const d = await page.$eval('#szczegoly', (e) => getComputedStyle(e).display);
    const label = await page.textContent('#przelacznik');
    await page.click('#przelacznik');
    const d2 = await page.$eval('#szczegoly', (e) => getComputedStyle(e).display);
    return d === 'block' && d2 === 'none' && /Ukryj/.test(label) ? null : `przełącznik: ${d}/${d2}/${label}`;
  },
  async jsFontSize(page) {
    const buttons = await page.$$('button[onclick^="zmienRozmiar"]');
    await buttons[2].click();
    const fs = await page.$eval('#tekst', (e) => e.style.fontSize);
    return /%$/.test(fs) ? null : `rozmiar czcionki: "${fs}"`;
  },
  async jsContactForm(page) {
    await page.click('button[onclick="wyslij()"]');
    const bad = await page.textContent('#komunikat');
    await page.fill('#imie', 'Ola');
    await page.fill('#email', 'ola@example.com');
    await page.fill('#tresc', 'To jest testowa wiadomość od Oli.');
    await page.check('#zgoda');
    await page.click('button[onclick="wyslij()"]');
    const ok = await page.textContent('#komunikat');
    return bad === 'Uzupełnij poprawnie formularz' && ok === 'Ola, dziękujemy za wiadomość' ? null : `formularz: "${bad}" / "${ok}"`;
  },
  async jsRandomFact(page) {
    await page.click('button[onclick="losujCiekawostke()"]');
    const t = await page.textContent('#ciekawostka');
    return t && t.includes(' – ') ? null : `ciekawostka: "${t}"`;
  },
  async jsHoverSwap(page) {
    const before = await page.$eval('#podmiana', (e) => e.src);
    await page.hover('#podmiana');
    const during = await page.$eval('#podmiana', (e) => e.src);
    await page.mouse.move(0, 0);
    const after = await page.$eval('#podmiana', (e) => e.src);
    return before !== during && after === before ? null : 'podmiana obrazu po najechaniu nie działa';
  },
  async jsBlurValidate(page) {
    await page.focus('#regImie');
    await page.focus('#regNazwisko');
    const red = await page.$eval('#regImie', (e) => e.style.border);
    const msg = await page.textContent('#stanPol');
    await page.fill('#regImie', 'Ola');
    await page.focus('#regTelefon');
    const green = await page.$eval('#regImie', (e) => e.style.border);
    await page.fill('#regTelefon', '600100200');
    await page.evaluate(() => document.activeElement.blur()); // bez fokusu - nie przesuwa układu przy kolejnych kliknięciach
    return red.includes('red') && msg.includes('imię') && green.includes('green') ? null : `walidacja: ${red} / ${msg} / ${green}`;
  },
  async jsTabs(page) {
    const buttons = await page.$$('button[onclick^="pokazZakladke"]');
    await buttons[2].click();
    const vis = await page.$$eval('[id^="zakladka"]', (els) => els.map((e) => getComputedStyle(e).display));
    return vis[0] === 'none' && vis[2] === 'block' ? null : `zakładki: ${vis}`;
  },
  async jsSlideshow(page) {
    const first = await page.$eval('#zdjecie', (e) => e.src);
    await page.click('button[onclick="zmienZdjecie(-1)"]');
    const last = await page.$eval('#zdjecie', (e) => e.src);
    await page.click('button[onclick="zmienZdjecie(1)"]');
    const back = await page.$eval('#zdjecie', (e) => e.src);
    return first !== last && back === first ? null : 'pokaz zdjęć: brak zawijania';
  },
  async jsTodo(page) {
    await page.fill('#zadanie', 'Kupić kwiaty');
    await page.click('button[onclick="dodajZadanie()"]');
    await page.click('#zadania li');
    const deco = await page.$eval('#zadania li', (e) => e.style.textDecoration);
    const val = await page.$eval('#zadanie', (e) => e.value);
    return deco === 'line-through' && val === '' ? null : `lista zadań: ${deco}/${val}`;
  },
  async jsVisitCounter(page) {
    const t = await page.textContent('#licznik');
    return /^Liczba odwiedzin: \d+$/.test(t) ? null : `licznik: "${t}"`;
  },
  async jsSummaryForm(page) {
    await page.fill('#imieNazwisko', 'Ola Nowak');
    await page.fill('#adres', 'OLA@Example.COM');
    await page.click('button[onclick="podsumuj()"]');
    const t = await page.innerHTML('#podsumowanie');
    return t.startsWith('OLA NOWAK<br>ola@example.com<br>Usługa: ') ? null : `podsumowanie: "${t}"`;
  },
  async jsColorButtons(page) {
    await page.fill('#rozmiar', '150');
    await page.click('button[onclick^="formatuj"]');
    const st = await page.$eval('#przyklad', (e) => [e.style.color, e.style.fontSize]);
    return st[0] && st[1] === '150%' ? null : `formatowanie: ${st}`;
  },
  async jsSearch(page, widget) {
    const name = widget.state.rows[0][Object.keys(widget.state.rows[0]).find((k) => typeof widget.state.rows[0][k] === 'string')];
    await page.fill('#szukaj', `  ${String(name).toUpperCase()} `);
    await page.click('button[onclick="szukaj()"]');
    const found = await page.textContent('#informacja');
    await page.fill('#szukaj', 'nie ma takiego');
    await page.click('button[onclick="szukaj()"]');
    const miss = await page.textContent('#informacja');
    return found.startsWith(name) && miss === 'Brak w bazie' ? null : `wyszukiwarka: "${found}" / "${miss}"`;
  },
};

const browser = await chromium.launch();
let failed = 0;
let checked = 0;
for (let i = 0; i < COUNT; i++) {
  const exam = generateExam({ seed: `JS${i}`, mode: ['client', 'mixed', 'animation'][i % 3], difficulty: ['easy', 'normal', 'hard'][i % 3], responsive: i % 4 === 0 ? 'yes' : 'random' });
  const errors = [];
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  // prawdziwy adres http (localStorage, względne ścieżki obrazów)
  const html = previewHtml(exam);
  await page.route('http://inf03.test/**', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: html }));
  await page.goto('http://inf03.test/index.html', { waitUntil: 'load' });
  for (const r of exam.site.rendered) {
    const check = CHECKS[r.widget.id];
    if (!check) continue;
    checked++;
    try {
      const problem = await check(page, r);
      if (problem) errors.push(problem);
    } catch (e) {
      errors.push(`${r.widget.id}: ${e.message.split('\n')[0]}`);
    }
  }
  // geometria układu: bloki w każdym wierszu obok siebie, wiersze jeden pod drugim
  await page.setViewportSize({ width: 1300, height: 900 });
  const geometry = await page.evaluate((rows) => rows.map((r) => r.map((sel) => {
    const el = document.querySelector(sel);
    const b = el.getBoundingClientRect();
    return { sel, top: Math.round(b.top), left: Math.round(b.left), width: Math.round(b.width) };
  })), exam.site.rows.map((r) => r.blocks.map((b) => (exam.site.defs[b].id ? `#${exam.site.defs[b].id}` : exam.site.defs[b].tag))));
  geometry.forEach((row) => {
    if (row.length > 1 && new Set(row.map((x) => x.top)).size > 1) errors.push(`układ: bloki ${row.map((x) => x.sel).join(', ')} nie są obok siebie (${exam.site.technique})`);
    row.slice(1).forEach((x, k) => { if (x.left <= row[k].left) errors.push(`układ: kolejność bloków ${row[k].sel} / ${x.sel}`); });
  });
  for (let k = 1; k < geometry.length; k++) {
    if (geometry[k][0].top < geometry[k - 1][0].top) errors.push(`układ: wiersz ${geometry[k][0].sel} nad poprzednim`);
  }
  if (exam.style.responsive) {
    await page.setViewportSize({ width: 600, height: 900 });
    const narrow = await page.evaluate((sels) => sels.map((s) => Math.round(document.querySelector(s).getBoundingClientRect().left)), exam.site.mainBlocks.map((b) => (exam.site.defs[b].id ? `#${exam.site.defs[b].id}` : exam.site.defs[b].tag)));
    if (new Set(narrow).size > 1) errors.push(`responsywność: przy 600 px bloki nie są jeden pod drugim (${exam.site.technique})`);
  }
  await page.close();
  if (errors.length) {
    failed++;
    console.log(`✗ ${exam.seed} ${exam.theme.id}: ${errors.join(' | ')}`);
  } else {
    console.log(`✓ ${exam.seed} ${exam.theme.id} (${exam.site.rendered.filter((r) => CHECKS[r.widget.id]).map((r) => r.widget.id).join(', ')})`);
  }
}
await browser.close();
console.log(`\nArkusze: ${COUNT}, z błędami: ${failed}, sprawdzonych skryptów: ${checked}`);
process.exit(failed ? 1 : 0);
