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
  const exam = generateExam({ seed: `JS${i}`, mode: i % 2 ? 'client' : 'animation', difficulty: ['easy', 'normal', 'hard'][i % 3] });
  const errors = [];
  const page = await browser.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setContent(previewHtml(exam), { waitUntil: 'load' });
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
