// Budowa witryny: wybór układu bloków, rozmieszczenie widżetów, numeracja zapytań i skryptów,
// kod rozwiązania wzorcowego oraz podgląd (ilustracja wyglądu witryny).
import { WIDGETS as BASE_WIDGETS } from './widgets.js';
import { EXTRA_WIDGETS } from './widgets-extra.js';
import { runPattern, pickStandalone } from './queries.js';
import { escapeXml } from './util.js';

const WIDGETS = { ...BASE_WIDGETS, ...EXTRA_WIDGETS };

// Bloki: tag HTML, identyfikator, nazwy: w dopełniaczu (do "Zawartość bloku ..."), przymiotnik (nom)
// oraz pełna nazwa w mianowniku (label) używana na ilustracji układu i w kryteriach oceniania.
const BLOCKS = {
  header: { tag: 'header', gen: 'bloku nagłówkowego', nom: 'nagłówkowy', label: 'blok nagłówkowy', kind: 'head' },
  banerL: { tag: 'header', id: 'baner-lewy', gen: 'banera lewego', nom: 'baner lewy', label: 'baner lewy', kind: 'head' },
  banerR: { tag: 'header', id: 'baner-prawy', gen: 'banera prawego', nom: 'baner prawy', label: 'baner prawy', kind: 'head' },
  nav: { tag: 'nav', gen: 'bloku nawigacyjnego', nom: 'nawigacyjny', label: 'blok nawigacyjny' },
  left: { tag: 'section', id: 'lewy', gen: 'bloku lewego', nom: 'lewy', label: 'blok lewy' },
  middle: { tag: 'section', id: 'srodkowy', gen: 'bloku środkowego', nom: 'środkowy', label: 'blok środkowy' },
  right: { tag: 'section', id: 'prawy', gen: 'bloku prawego', nom: 'prawy', label: 'blok prawy' },
  section: { tag: 'section', gen: 'bloku sekcji', nom: 'sekcji', label: 'blok sekcji' },
  aside: { tag: 'aside', gen: 'bloku bocznego', nom: 'boczny', label: 'blok boczny' },
  s1: { tag: 'section', id: 'sekcja1', gen: 'pierwszego bloku sekcji', nom: 'pierwszy sekcji', label: 'blok sekcji 1' },
  s2: { tag: 'section', id: 'sekcja2', gen: 'drugiego bloku sekcji', nom: 'drugi sekcji', label: 'blok sekcji 2' },
  s3: { tag: 'section', id: 'sekcja3', gen: 'trzeciego bloku sekcji', nom: 'trzeci sekcji', label: 'blok sekcji 3' },
  s4: { tag: 'section', id: 'sekcja4', gen: 'czwartego bloku sekcji', nom: 'czwarty sekcji', label: 'blok sekcji 4' },
  footer: { tag: 'footer', gen: 'stopki', nom: 'stopka', label: 'stopka', kind: 'foot' },
  stopkaL: { tag: 'footer', id: 'stopka-lewa', gen: 'stopki lewej', nom: 'stopka lewa', label: 'stopka lewa', kind: 'foot' },
  stopkaR: { tag: 'footer', id: 'stopka-prawa', gen: 'stopki prawej', nom: 'stopka prawa', label: 'stopka prawa', kind: 'foot' },
};

// top/bottom: wiersze nad i pod blokiem głównym; tablica w miejscu nazwy = bloki obok siebie (np. dwa banery).
export const LAYOUTS = [
  { id: 'nav-2col', name: 'nagłówek, nawigacja, 2 kolumny', top: ['header', 'nav'], main: ['left', 'right'], widths: [[50, 50], [40, 60], [60, 40], [35, 65]] },
  { id: '3col', name: 'nagłówek, nawigacja, 3 kolumny', top: ['header', 'nav'], main: ['left', 'middle', 'right'], widths: [[25, 50, 25], [33.3, 33.3, 33.3], [20, 50, 30], [30, 40, 30]] },
  { id: 'aside-section', name: 'blok boczny + sekcja', top: ['header'], main: ['aside', 'section'], widths: [[25, 75], [30, 70], [20, 80]] },
  { id: 'section-aside', name: 'nawigacja, sekcja + blok boczny', top: ['header', 'nav'], main: ['section', 'aside'], widths: [[70, 30], [75, 25], [65, 35]] },
  { id: 'nav-section-aside', name: 'menu z lewej, sekcja, blok boczny', top: ['header'], main: ['nav', 'section', 'aside'], widths: [[20, 60, 20], [25, 50, 25], [15, 60, 25]] },
  { id: '4col', name: 'nagłówek, nawigacja, 4 kolumny', top: ['header', 'nav'], main: ['s1', 's2', 's3', 's4'], widths: [[25, 25, 25, 25], [20, 30, 30, 20], [30, 20, 20, 30]] },
  { id: 'banery-2col', name: 'dwa banery, nawigacja, 2 kolumny', top: [['banerL', 'banerR'], 'nav'], main: ['left', 'right'], widths: [[50, 50], [40, 60]], split: [[70, 30], [75, 25], [60, 40]] },
  { id: 'banery-menu', name: 'dwa banery, menu z lewej + sekcja', top: [['banerL', 'banerR']], main: ['nav', 'section'], widths: [[20, 80], [25, 75], [30, 70]], split: [[70, 30], [80, 20]] },
  { id: '3col-stopki', name: '3 kolumny, dwie stopki', top: ['header'], main: ['left', 'middle', 'right'], bottom: [['stopkaL', 'stopkaR']], widths: [[25, 50, 25], [30, 40, 30]], split: [[50, 50], [70, 30]] },
  { id: 'banery-3col-stopki', name: 'dwa banery, 3 kolumny, dwie stopki', top: [['banerL', 'banerR']], main: ['left', 'middle', 'right'], bottom: [['stopkaL', 'stopkaR']], widths: [[20, 60, 20], [25, 50, 25]], split: [[70, 30], [60, 40]] },
];

export const hasSplitRows = (layout) => [...layout.top, ...(layout.bottom || ['footer'])].some(Array.isArray);

class QueryRegistry {
  constructor(ctx) {
    this.ctx = ctx;
    this.items = [];
  }
  request(patterns, filter) {
    for (const name of this.ctx.rng.shuffle(patterns)) {
      if (this.items.some((i) => i.result.pattern === name)) continue;
      for (let attempt = 0; attempt < 4; attempt++) {
        const r = runPattern(name, { ...this.ctx, rng: this.ctx.rng.fork(`${name}${attempt}${this.items.length}`) });
        if (r && (!filter || filter(r))) {
          const ref = { __ref: true, result: r, number: 0, usedBy: null };
          this.items.push(ref);
          return ref;
        }
      }
    }
    return null;
  }
  finalize(total, difficulty) {
    const extra = pickStandalone(this.ctx, Math.max(0, total - this.items.length), this.items.map((i) => i.result), difficulty);
    for (const r of extra) this.items.push({ __ref: true, result: r, number: 0, usedBy: null });
    // Modyfikacje (INSERT/UPDATE/ALTER/CREATE USER) zwykle zamykają listę kwerend - jak w arkuszach CKE.
    const isMod = (i) => ['dml', 'ddl', 'admin'].includes(i.result.group) && !i.usedBy;
    const sel = this.ctx.rng.shuffle(this.items.filter((i) => !isMod(i)));
    const mod = this.items.filter(isMod);
    this.items = [...sel, ...mod];
    this.items.forEach((i, idx) => { i.number = idx + 1; });
  }
}

const refsOf = (state) => Object.values(state || {}).filter((v) => v && v.__ref);

// Kolejność prób doboru widżetów dynamicznych: pierwszy jest "główny", pozostałe uzupełniają liczbę skryptów.
function dynamicCandidates(rng, mode) {
  if (mode === 'mixed') {
    // PHP + JavaScript na jednej stronie: główny widżet PHP, potem naprzemiennie JS i PHP
    const php = dynamicCandidates(rng.fork('php'), 'server');
    const js = dynamicCandidates(rng.fork('js'), 'client');
    const out = [php[0]];
    for (let i = 0; i < Math.max(php.length, js.length); i++) {
      if (js[i]) out.push(js[i]);
      if (php[i + 1]) out.push(php[i + 1]);
    }
    return out;
  }
  if (mode === 'server') {
    const primary = rng.weighted([['phpSelectDetail', 3], ['phpRadioFilter', 3], ['phpLinksDetail', 2], ['phpInsertForm', 2], ['phpTable', 3], ['phpSearchLike', 2], ['phpUpdateForm', 1], ['phpRowBlocks', 2]]);
    const rest = ['phpTable', 'phpRadioFilter', 'phpSelectDetail', 'phpInsertForm', 'phpGallery', 'phpList', 'phpStats', 'phpCards', 'phpSearchLike', 'phpUpdateForm', 'phpTemplateList', 'phpRowBlocks', 'phpDateInfo', 'phpDefList'];
    return [primary, ...rng.shuffle(rest.filter((w) => w !== primary))];
  }
  const primary = rng.pick(['jsCalculator', 'jsSearch', 'jsContactForm', 'jsThumbs', 'jsTabs', 'jsSlideshow', 'jsTodo', 'jsSummaryForm']);
  const rest = ['jsCalculator', 'jsSlider', 'jsThumbs', 'jsToggle', 'jsFontSize', 'jsContactForm', 'jsSearch', 'jsDate', 'jsTabs', 'jsSlideshow', 'jsTodo', 'jsVisitCounter', 'jsSummaryForm', 'jsColorButtons', 'jsRandomFact', 'jsHoverSwap', 'jsBlurValidate'];
  return [primary, ...rng.shuffle(rest.filter((w) => w !== primary))];
}

export function buildSite(ctx, { mode, difficulty, queryCount, animation, layoutId = 'random', technique = 'float' }) {
  const { rng } = ctx;
  const allowed = technique === 'float' ? LAYOUTS : LAYOUTS.filter((l) => !hasSplitRows(l));
  const layout = (layoutId !== 'random' && LAYOUTS.find((l) => l.id === layoutId)) || rng.pick(allowed);
  const widths = rng.pick(layout.widths);
  const split = layout.split ? rng.pick(layout.split) : null;
  const height = rng.pick([350, 400, 450, 500, 550, 600]);
  const ext = mode === 'client' ? 'html' : 'php';
  ctx.registry = new QueryRegistry(ctx);

  const candidates = dynamicCandidates(rng, mode);
  const twoPage = WIDGETS[candidates[0]].twoPages;
  ctx.pages = twoPage ? [{ file: `index.${ext}` }, { file: rng.pick(['szczegoly', 'opis', 'wynik']) + `.${ext}` }] : [{ file: `index.${ext}` }];

  // wiersze strony: [{ blocks, widths, main }]
  const bottom = layout.bottom || ['footer'];
  const toRow = (item) => (Array.isArray(item) ? { blocks: item, widths: split } : { blocks: [item], widths: [100] });
  const rows = [...layout.top.map(toRow), { blocks: layout.main, widths, main: true }, ...bottom.map(toRow)];
  const blocks = rows.flatMap((r) => r.blocks);

  // --- planowanie widżetów ---
  const placed = []; // { block, widget, state }
  const plan = (block, id, opts) => {
    const w = WIDGETS[id];
    const before = ctx.registry.items.slice();
    const state = w.plan(ctx, opts);
    if (!state) {
      ctx.registry.items = before; // widżet się nie zmieścił - zwalniamy zarezerwowane zapytania
      return false;
    }
    placed.push({ block, widget: w, state });
    return true;
  };

  plan(blocks.includes('banerL') ? 'banerL' : 'header', 'heading');
  if (blocks.includes('banerR')) plan('banerR', 'image', { file: ctx.theme.images.logo, alt: 'Logo' });
  if (blocks.includes('nav')) plan('nav', 'navLinks');

  const mainBlocks = layout.main.map((b, i) => ({ b, w: widths[i] }));
  const contentOrder = mainBlocks.filter((x) => x.b !== 'nav').sort((a, b) => b.w - a.w).map((x) => x.b);

  const targetScripts = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3;
  let scriptCount = 0;
  let slot = 0;
  for (const id of candidates) {
    if (scriptCount >= targetScripts) break;
    const w = WIDGETS[id];
    if (slot > 0 && (w.twoPages || scriptCount + w.scripts > targetScripts + 1)) continue;
    const block = contentOrder[slot % contentOrder.length];
    if (plan(block, id)) {
      slot++;
      scriptCount += w.scripts;
    }
  }
  // widżet dwustronicowy mógł się nie zmieścić - wtedy witryna ma jedną stronę
  if (ctx.pages.length > 1 && !placed.some((p) => p.widget.twoPages)) ctx.pages = [ctx.pages[0]];
  if (animation) {
    const small = contentOrder[contentOrder.length - 1];
    plan(small, 'image', { file: animation.file, alt: animation.alt });
  }
  // Bloki bez treści dostają widżety statyczne.
  const statics = rng.shuffle(['image', 'contact', 'paragraph', 'staticTable', 'staticMergedTable']);
  for (const b of contentOrder) {
    while (!placed.some((p) => p.block === b) && statics.length) plan(b, statics.shift());
  }
  if (rng.chance(0.5) && statics.length) plan(contentOrder[contentOrder.length - 1], statics.shift());
  if (blocks.includes('stopkaL')) {
    plan('stopkaL', 'footerAuthor');
    plan('stopkaR', 'footerLink');
  } else plan('footer', 'footerAuthor');

  // --- numeracja zapytań i skryptów ---
  const totalQueries = Math.max(queryCount, ctx.registry.items.length);
  ctx.registry.finalize(totalQueries, difficulty);
  const blockOrder = (b) => blocks.indexOf(b);
  placed.sort((a, b) => blockOrder(a.block) - blockOrder(b.block));
  let scriptNo = 0;
  const scripts = [];
  const rendered = [];
  for (const p of placed) {
    const refs = refsOf(p.state);
    refs.forEach((r) => { r.usedBy = p.widget.id; });
    const num = { q: refs.map((r) => r.number), s: Array.from({ length: p.widget.scripts || 0 }, () => ++scriptNo) };
    const out = p.widget.render(ctx, p.state, num);
    (out.scripts || []).forEach((s, i) => scripts.push({ number: num.s[i], ...s, widget: p.widget.id, lang: p.widget.server ? 'php' : 'js' }));
    rendered.push({ ...p, out });
  }
  scripts.sort((a, b) => a.number - b.number);

  const site = {
    mode, ext, layout, widths, split, rows, height, technique: hasSplitRows(layout) ? 'float' : technique, pages: ctx.pages, blocks, mainBlocks: layout.main,
    defs: Object.fromEntries(blocks.map((b) => [b, BLOCKS[b]])),
    rendered, scripts,
    queries: ctx.registry.items,
    tags: new Set(rendered.flatMap((r) => r.out.tags || [])),
    classes: rendered.flatMap((r) => r.out.classes || []),
    files: [...new Set(rendered.flatMap((r) => r.out.files || []))],
    js: rendered.filter((r) => r.out.js).map((r) => r.out.js).join('\n\n'),
  };
  return site;
}

// ---------- generowanie dokumentów HTML ----------

const blockSelectorAttr = (def) => (def.id ? ` id="${def.id}"` : '');

export function pageHtml(site, theme, { page = 0, preview = false, css = 'styl.css', inlineCss = null, imageResolver = null, cssPath } = {}) {
  const contentFor = (b) => site.rendered.filter((r) => r.block === b).map((r) => {
    if (page === 1 && r.out.page2) return preview ? r.out.page2.preview : r.out.page2.html;
    return preview && r.out.preview !== undefined ? r.out.preview : r.out.html;
  }).join('\n');
  const block = (b) => {
    const def = site.defs[b];
    return `<${def.tag}${blockSelectorAttr(def)}>\n${indentHtml(contentFor(b))}\n</${def.tag}>`;
  };
  const body = site.rows.map((r) => (r.main ? `<main>\n${indentHtml(r.blocks.map(block).join('\n'))}\n</main>` : r.blocks.map(block).join('\n'))).join('\n');
  const usesPhp = site.ext === 'php' && !preview && site.rendered.some((r) => /<\?php/.test(page === 1 && r.out.page2 ? r.out.page2.html : r.out.html));
  const head = [
    '<!DOCTYPE html>',
    '<html lang="pl">',
    '<head>',
    '    <meta charset="UTF-8">',
    `    <title>${escapeXml(theme.siteTitle)}</title>`,
    inlineCss !== null ? `    <style>\n${inlineCss}\n    </style>` : `    <link rel="stylesheet" href="${cssPath || css}">`,
    '</head>',
    '<body>',
  ];
  const scriptTag = site.js ? (preview ? `<script>\n${site.js}\n</script>` : '<script src="skrypt.js"></script>') : '';
  let html = [...head, indentHtml(body), ...(scriptTag ? [indentHtml(scriptTag)] : []), '</body>', '</html>'].join('\n');
  if (usesPhp) {
    html = `<?php\n$polaczenie = mysqli_connect('localhost', 'root', '', '${theme.dbName}');\n?>\n${html}\n<?php\nmysqli_close($polaczenie);\n?>`;
  }
  if (imageResolver) {
    // atrybuty src oraz nazwy plików w napisach skryptów (np. tablica zdjęć w pokazie slajdów)
    html = html.replace(/src=(["'])([^"'$]+?\.(?:png|jpe?g|gif|bmp|webp))\1/g, (m, qch, f) => `src=${qch}${imageResolver(f)}${qch}`);
    html = html.replace(/'([\w-]+\.(?:png|jpe?g|gif|bmp|webp))'/g, (m, f) => `'${imageResolver(f)}'`);
  }
  return html;
}

function indentHtml(s) {
  return s.split('\n').map((l) => (l.trim() ? `    ${l}` : l)).join('\n');
}

// Ilustracja układu bloków (odpowiednik "Ilustracja 3. Układ bloków").
export function layoutSvg(site) {
  const W = 360, rowH = 34, mainH = 120, gap = 4;
  const rects = [];
  let y = 4;
  for (const r of site.rows) {
    const h = r.main ? mainH : rowH;
    let x = 4;
    r.blocks.forEach((b, i) => {
      const w = ((W - 8) * r.widths[i]) / 100;
      rects.push(rect(x, y, w - (i < r.blocks.length - 1 ? gap : 0), h, site.defs[b].label));
      x += w;
    });
    y += h + gap;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}" font-family="Arial, sans-serif">${rects.join('')}</svg>`;
}

function rect(x, y, w, h, text) {
  const size = Math.min(12, Math.floor(w / (text.length * 0.58)));
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#222" stroke-width="1.5"/>`
    + `<text x="${x + w / 2}" y="${y + h / 2 + 4}" font-size="${size}" text-anchor="middle">${escapeXml(text)}</text>`;
}
