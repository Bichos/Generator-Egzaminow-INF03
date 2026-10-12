// Budowa witryny: wybór układu bloków, rozmieszczenie widżetów, numeracja zapytań i skryptów,
// kod rozwiązania wzorcowego oraz podgląd (ilustracja wyglądu witryny).
import { WIDGETS as BASE_WIDGETS } from './widgets.js';
import { EXTRA_WIDGETS } from './widgets-extra.js';
import { runPattern, pickStandalone } from './queries.js';
import { escapeXml } from './util.js';

const WIDGETS = { ...BASE_WIDGETS, ...EXTRA_WIDGETS };

// Bloki: tag HTML, identyfikator (dla sekcji), nazwy w dopełniaczu (do "Zawartość bloku ...") i mianowniku.
const BLOCKS = {
  header: { tag: 'header', gen: 'bloku nagłówkowego', nom: 'nagłówkowy' },
  nav: { tag: 'nav', gen: 'bloku nawigacyjnego', nom: 'nawigacyjny' },
  left: { tag: 'section', id: 'lewy', gen: 'bloku lewego', nom: 'lewy' },
  middle: { tag: 'section', id: 'srodkowy', gen: 'bloku środkowego', nom: 'środkowy' },
  right: { tag: 'section', id: 'prawy', gen: 'bloku prawego', nom: 'prawy' },
  section: { tag: 'section', gen: 'bloku sekcji', nom: 'sekcji' },
  aside: { tag: 'aside', gen: 'bloku bocznego', nom: 'boczny' },
  footer: { tag: 'footer', gen: 'stopki', nom: 'stopka' },
};

const LAYOUTS = [
  { id: 'nav-2col', top: ['header', 'nav'], main: ['left', 'right'], widths: [[50, 50], [40, 60], [60, 40], [35, 65]] },
  { id: '3col', top: ['header', 'nav'], main: ['left', 'middle', 'right'], widths: [[25, 50, 25], [33.3, 33.3, 33.3], [20, 50, 30], [30, 40, 30]] },
  { id: 'aside-section', top: ['header'], main: ['aside', 'section'], widths: [[25, 75], [30, 70], [20, 80]] },
  { id: 'section-aside', top: ['header', 'nav'], main: ['section', 'aside'], widths: [[70, 30], [75, 25], [65, 35]] },
  { id: 'nav-section-aside', top: ['header'], main: ['nav', 'section', 'aside'], widths: [[20, 60, 20], [25, 50, 25], [15, 60, 25]] },
];

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
  if (mode === 'server') {
    const primary = rng.weighted([['phpSelectDetail', 3], ['phpRadioFilter', 3], ['phpLinksDetail', 2], ['phpInsertForm', 2], ['phpTable', 3], ['phpSearchLike', 2], ['phpUpdateForm', 1], ['phpRowBlocks', 2]]);
    const rest = ['phpTable', 'phpRadioFilter', 'phpSelectDetail', 'phpInsertForm', 'phpGallery', 'phpList', 'phpStats', 'phpCards', 'phpSearchLike', 'phpUpdateForm', 'phpTemplateList', 'phpRowBlocks'];
    return [primary, ...rng.shuffle(rest.filter((w) => w !== primary))];
  }
  const primary = rng.pick(['jsCalculator', 'jsSearch', 'jsContactForm', 'jsThumbs', 'jsTabs', 'jsSlideshow', 'jsTodo', 'jsSummaryForm']);
  const rest = ['jsCalculator', 'jsSlider', 'jsThumbs', 'jsToggle', 'jsFontSize', 'jsContactForm', 'jsSearch', 'jsDate', 'jsTabs', 'jsSlideshow', 'jsTodo', 'jsVisitCounter', 'jsSummaryForm', 'jsColorButtons'];
  return [primary, ...rng.shuffle(rest.filter((w) => w !== primary))];
}

export function buildSite(ctx, { mode, difficulty, queryCount, animation }) {
  const { rng } = ctx;
  const layout = rng.pick(LAYOUTS);
  const widths = rng.pick(layout.widths);
  const height = rng.pick([350, 400, 450, 500, 550, 600]);
  const ext = mode === 'server' ? 'php' : 'html';
  ctx.registry = new QueryRegistry(ctx);

  const candidates = dynamicCandidates(rng, mode);
  const twoPage = WIDGETS[candidates[0]].twoPages;
  ctx.pages = twoPage ? [{ file: `index.${ext}` }, { file: rng.pick(['szczegoly', 'opis', 'wynik']) + `.${ext}` }] : [{ file: `index.${ext}` }];

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

  const blocks = [...layout.top, ...layout.main, 'footer'];
  plan('header', 'heading');
  if (layout.top.includes('nav')) plan('nav', 'navLinks');

  const mainBlocks = layout.main.map((b, i) => ({ b, w: widths[i] }));
  const contentOrder = mainBlocks.filter((x) => x.b !== 'nav').sort((a, b) => b.w - a.w).map((x) => x.b);
  if (layout.main.includes('nav')) plan('nav', 'navLinks');

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
  if (animation) {
    const small = contentOrder[contentOrder.length - 1];
    plan(small, 'image', { file: animation.file, alt: animation.alt });
  }
  // Bloki bez treści dostają widżety statyczne.
  const statics = rng.shuffle(['image', 'contact', 'paragraph', 'staticTable']);
  for (const b of contentOrder) {
    if (!placed.some((p) => p.block === b)) plan(b, statics.shift());
  }
  if (rng.chance(0.5) && statics.length) plan(contentOrder[contentOrder.length - 1], statics.shift());
  plan('footer', 'footerAuthor');

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
    (out.scripts || []).forEach((s, i) => scripts.push({ number: num.s[i], ...s, widget: p.widget.id }));
    rendered.push({ ...p, out });
  }
  scripts.sort((a, b) => a.number - b.number);

  const site = {
    mode, ext, layout, widths, height, pages: ctx.pages, blocks, mainBlocks: layout.main,
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
  const body = [
    ...site.layout.top.map(block),
    `<main>\n${indentHtml(site.mainBlocks.map(block).join('\n'))}\n</main>`,
    block('footer'),
  ].join('\n');
  const usesPhp = site.mode === 'server' && !preview && site.rendered.some((r) => /<\?php/.test(page === 1 && r.out.page2 ? r.out.page2.html : r.out.html));
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
  const label = (b) => `blok ${site.defs[b].nom}`;
  for (const b of site.layout.top) {
    rects.push(rect(4, y, W - 8, rowH, label(b)));
    y += rowH + gap;
  }
  let x = 4;
  site.mainBlocks.forEach((b, i) => {
    const w = ((W - 8) * site.widths[i]) / 100;
    rects.push(rect(x, y, w - (i < site.mainBlocks.length - 1 ? gap : 0), mainH, label(b)));
    x += w;
  });
  y += mainH + gap;
  rects.push(rect(4, y, W - 8, rowH, label('footer').replace('blok stopka', 'stopka')));
  y += rowH + 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}" font-family="Arial, sans-serif">${rects.join('')}</svg>`;
}

function rect(x, y, w, h, text) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#222" stroke-width="1.5"/>`
    + `<text x="${x + w / 2}" y="${y + h / 2 + 4}" font-size="12" text-anchor="middle">${escapeXml(text)}</text>`;
}
