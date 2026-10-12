// Generator wymagań CSS. Każda reguła ma opis po polsku (do arkusza) i deklaracje (do styl.css w rozwiązaniu).
import { joinPl } from './util.js';

export const PALETTES = [
  { name: 'zielona', dark: 'DarkGreen', mid: 'ForestGreen', light: 'LightGreen', lighter: 'Honeydew', accent: 'SeaGreen' },
  { name: 'niebieska', dark: 'Navy', mid: 'SteelBlue', light: 'LightSteelBlue', lighter: 'AliceBlue', accent: 'DodgerBlue' },
  { name: 'czerwona', dark: 'Maroon', mid: 'IndianRed', light: 'LightSalmon', lighter: 'MistyRose', accent: 'Crimson' },
  { name: 'fioletowa', dark: 'Indigo', mid: 'MediumPurple', light: 'Thistle', lighter: 'Lavender', accent: 'DarkOrchid' },
  { name: 'brązowa', dark: 'SaddleBrown', mid: 'Peru', light: 'Wheat', lighter: 'Cornsilk', accent: 'Chocolate' },
  { name: 'morska', dark: 'Teal', mid: 'CadetBlue', light: 'PaleTurquoise', lighter: 'Azure', accent: 'DarkCyan' },
  { name: 'szara', dark: 'DarkSlateGray', mid: 'SlateGray', light: 'Gainsboro', lighter: 'WhiteSmoke', accent: 'DimGray' },
  { name: 'turkusowa (hex)', dark: '#05445E', mid: '#189AB4', light: '#75E6DA', lighter: '#D4F1F4', accent: '#0F7C8C' },
  { name: 'oliwkowa (hex)', dark: '#3D441E', mid: '#6B7A3A', light: '#C5D29F', lighter: '#F1F5E4', accent: '#8A9A5B' },
  { name: 'pomarańczowa (hex)', dark: '#8C3B0C', mid: '#D9731A', light: '#F7C59F', lighter: '#FFF1E6', accent: '#E85D04' },
];

export const FONTS = [
  ['Helvetica', 'sans-serif'], ['Georgia', 'serif'], ['Garamond', 'serif'], ['Tahoma', 'sans-serif'], ['Verdana', 'sans-serif'],
  ['Trebuchet MS', 'sans-serif'], ['Arial', 'sans-serif'], ['Courier New', 'monospace'], ['Times New Roman', 'serif'], ['Lucida Console', 'monospace'],
];

export const TAG_GEN = {
  body: 'ciała strony', h1: 'nagłówka pierwszego stopnia', h2: 'nagłówka drugiego stopnia', h3: 'nagłówka trzeciego stopnia',
  p: 'paragrafu', table: 'tabeli', td: 'komórki tabeli', th: 'komórki nagłówkowej', tr: 'wiersza tabeli', img: 'obrazu', a: 'odnośnika',
  ul: 'listy punktowanej', ol: 'listy numerowanej', li: 'elementu listy', button: 'przycisku', input: 'pola input', select: 'listy rozwijanej',
  textarea: 'obszaru tekstowego', form: 'formularza', label: 'etykiety',
};

const BORDER_STYLE = { solid: 'ciągłą', dashed: 'przerywaną', dotted: 'kropkową', double: 'podwójną' };
const colorPl = (v) => ({ white: 'biały', black: 'czarny' }[v] || v);

// Opis jednej deklaracji po polsku.
export function declPl(prop, v) {
  switch (prop) {
    case 'background-color': return `kolor tła ${colorPl(v)}`;
    case 'color': return v === 'white' ? 'biały kolor czcionki' : v === 'black' ? 'czarny kolor czcionki' : `kolor czcionki ${v}`;
    case 'font-family': {
      const [a, b] = v.split(',').map((x) => x.trim().replace(/"/g, ''));
      return b ? `krój czcionki ${a}, w przypadku braku ${b}` : `krój czcionki ${a}`;
    }
    case 'padding': return `marginesy wewnętrzne ${px(v)}`;
    case 'padding-top': return `jedynie górny margines wewnętrzny ${px(v)}`;
    case 'margin': return v === '0 auto' || v === 'auto' ? 'marginesy zewnętrzne automatycznie wyliczane przez przeglądarkę' : /auto/.test(v) ? `marginesy zewnętrzne: górny i dolny ${px(v.split(' ')[0])}, lewy i prawy automatycznie wyliczane przez przeglądarkę` : `marginesy zewnętrzne ${px(v)}`;
    case 'margin-left': return `jedynie lewy margines zewnętrzny ${px(v)}`;
    case 'width': return `szerokość ${px(v)}`;
    case 'height': return `wysokość ${px(v)}`;
    case 'min-height': return `minimalna wysokość ${px(v)}`;
    case 'text-align': return { center: 'wyrównanie tekstu do środka', right: 'wyrównanie tekstu do prawej', left: 'wyrównanie tekstu do lewej', justify: 'wyjustowanie tekstu' }[v];
    case 'border-radius': return `zaokrąglenie rogów ${px(v)}`;
    case 'box-shadow': {
      const [x, y, blur, c] = v.split(' ');
      return x === y ? `cień przesunięty o ${px(x)} w poziomie i w pionie, rozmycie ${px(blur)}, kolor ${colorPl(c)}` : `cień przesunięty o ${px(x)} w poziomie i ${px(y)} w pionie, rozmycie ${px(blur)}, kolor ${colorPl(c)}`;
    }
    case 'border': {
      if (v === 'none') return 'brak obramowania';
      const [w, style, c] = v.split(' ');
      return `obramowanie linią ${BORDER_STYLE[style]} o szerokości ${px(w)} i kolorze ${colorPl(c)}`;
    }
    case 'border-collapse': return 'obramowanie połączone (pojedyncze linie)';
    case 'overflow': return v === 'auto' ? 'paski przewijania widoczne jedynie w przypadku przepełnienia bloku' : 'w przypadku przepełnienia bloku jego pozostała zawartość jest ukryta';
    case 'font-size': return `rozmiar czcionki ${px(v)}`;
    case 'font-style': return 'kursywa';
    case 'font-weight': return 'pogrubienie czcionki';
    case 'letter-spacing': return `odstępy między literami ${px(v)}`;
    case 'text-transform': return 'wszystkie litery zamienione na wielkie (transformacja tekstu)';
    case 'text-decoration': return v === 'none' ? 'tekst bez podkreślenia' : 'tekst podkreślony';
    case 'list-style-type': return { none: 'brak punktora', square: 'punktor w kształcie kwadratu', circle: 'punktor w kształcie okręgu', 'upper-roman': 'numeracja liczbami rzymskimi', 'lower-alpha': 'numeracja małymi literami' }[v];
    case 'display': return v === 'inline-block' ? 'sposób wyświetlania elementu liniowo-blokowy' : 'sposób wyświetlania elementu blokowy';
    case 'cursor': return 'kursor w kształcie wskazującej dłoni (pointer)';
    case 'opacity': return `przezroczystość elementu ${v}`;
    case 'line-height': return `wysokość linii ${px(v)}`;
    case 'font-variant': return 'kapitaliki';
    case 'vertical-align': return 'wyrównanie w pionie do góry';
    default: return `${prop}: ${v}`;
  }
}

const px = (v) => String(v).replace(/(\d)(px|em)\b/g, '$1 $2');

function rule(target, selector, decls, opts = {}) {
  return { target, selector, decls, ...opts };
}

export function buildCss(site, rng) {
  const P = rng.pick(PALETTES);
  const font = rng.pick(FONTS);
  const fontValue = font[0].includes(' ') ? `"${font[0]}", ${font[1]}` : `${font[0]}, ${font[1]}`;
  const sel = (b) => (site.defs[b].id ? `#${site.defs[b].id}` : site.defs[b].tag);
  const gen = (b) => site.defs[b].gen;
  const rules = [];
  const tagOnly = new Set();

  // 1. Krój czcionki
  if (rng.chance(0.5)) {
    rules.push(rule('Domyślnie dla wszystkich selektorów', '*', [['font-family', fontValue], ...(rng.chance(0.3) ? [['text-align', 'center']] : [])]));
  } else {
    rules.push(rule('Dla selektora ciała strony', 'body', [['font-family', fontValue], ...(rng.chance(0.4) ? [['background-color', P.lighter]] : [])]));
    tagOnly.add('body');
  }

  // 2. Nagłówek i stopka
  const pad = rng.pick(['5px', '10px', '15px', '2px', '3px']);
  const hf = [['background-color', P.dark], ['color', 'white'], ['padding', pad], ['text-align', 'center']];
  if (rng.chance(0.6)) {
    rules.push(rule('Wspólne dla bloku nagłówkowego i stopki', 'header, footer', hf));
  } else {
    rules.push(rule('Dla bloku nagłówkowego', 'header', [...hf, ...(rng.chance(0.5) ? [['letter-spacing', rng.pick(['2px', '3px', '5px'])]] : [])]));
    rules.push(rule('Dla stopki', 'footer', [['background-color', P.mid], ['color', 'white'], ['padding', pad], ['text-align', rng.pick(['center', 'right'])]]));
  }

  // 3. Bloki
  const topNav = site.layout.top.includes('nav');
  if (topNav) rules.push(rule('Dla bloku nawigacyjnego', 'nav', [['background-color', P.mid], ['padding', rng.pick(['5px', '10px'])], ...(rng.chance(0.4) ? [['text-align', 'center']] : [])]));
  const mains = site.mainBlocks;
  const height = `${site.height}px`;
  // blok z kilkoma widżetami nie zmieści się w stałej wysokości - paski przewijania są wtedy konieczne
  const crowded = mains.some((b) => site.rendered.filter((r) => r.block === b).length >= 2);
  rules.push(rule(`Wspólne dla ${joinPl(mains.map(gen))}`, mains.map(sel).join(', '), [['height', height], ...(crowded || rng.chance(0.5) ? [['overflow', 'auto']] : [])]));
  const pair = rng.shuffle([P.light, P.lighter]);
  const bgs = [pair[0], pair[1], pair[0]]; // sąsiednie bloki zawsze różnią się kolorem tła
  mains.forEach((b, i) => {
    const decls = [['width', `${site.widths[i]}%`]];
    const bg = b === 'nav' && !topNav ? P.mid : bgs[i % bgs.length];
    decls.unshift(['background-color', bg]);
    if (b === 'aside' && rng.chance(0.4)) decls.push(['text-align', 'center']);
    rules.push(rule(`Dla ${gen(b)}`, sel(b), decls));
  });

  // 4. Reguły dla znaczników (tylko selektor znacznika)
  const tags = site.tags;
  const tagRules = [];
  if (tags.has('table')) {
    const bc = rng.pick(['solid', 'solid', 'dashed', 'dotted']);
    tagRules.push(rule('Wspólne dla selektora tabeli, komórki tabeli i komórki nagłówkowej', 'table, td, th', [['border', `1px ${bc} ${P.dark}`]], { tags: ['table', 'td', 'th'] }));
    tagRules.push(rule('Dodatkowo dla selektora tabeli', 'table', [['width', rng.pick(['80%', '90%', '95%'])], ['border-collapse', 'collapse'], ...(rng.chance(0.5) ? [['margin', '10px auto']] : [])], { tags: ['table'] }));
    if (rng.chance(0.5)) tagRules.push(rule('Dla selektora komórki tabeli i komórki nagłówkowej', 'td, th', [['padding', rng.pick(['3px', '5px', '8px'])]], { tags: ['td', 'th'] }));
  }
  const pool = [];
  if (tags.has('h2')) pool.push(rule('Dla selektora nagłówka drugiego stopnia', 'h2', rng.pick([[['letter-spacing', '2px'], ['text-transform', 'uppercase']], [['font-size', '150%'], ['font-variant', 'small-caps']], [['text-align', 'center'], ['color', P.dark]]]), { tags: ['h2'] }));
  if (tags.has('h3')) pool.push(rule('Dla selektora nagłówka trzeciego stopnia', 'h3', rng.pick([[['font-style', 'italic']], [['text-align', 'center'], ['color', P.accent]], [['letter-spacing', '1px']]]), { tags: ['h3'] }));
  if (tags.has('p')) pool.push(rule('Dla selektora paragrafu', 'p', rng.pick([[['font-size', rng.pick(['110%', '120%', '90%'])]], [['font-size', '120%'], ['font-style', 'italic']], [['line-height', '150%']]]), { tags: ['p'] }));
  if (tags.has('img')) pool.push(rule('Dla selektora obrazu', 'img', [['width', rng.pick(['90%', '150px', '200px'])], ['border-radius', rng.pick(['5px', '10px', '15px'])], ['margin', '5px']], { tags: ['img'] }));
  if (tags.has('a')) pool.push(rule('Dla selektora odnośnika', 'a', [['color', P.dark], ['text-decoration', 'none'], ...(rng.chance(0.4) ? [['font-weight', 'bold']] : [])], { tags: ['a'] }));
  if (tags.has('ul')) pool.push(rule('Dla selektora listy punktowanej', 'ul', [['list-style-type', rng.pick(['square', 'circle', 'none'])]], { tags: ['ul'] }));
  if (tags.has('ol')) pool.push(rule('Dla selektora listy numerowanej', 'ol', [['list-style-type', rng.pick(['upper-roman', 'lower-alpha'])]], { tags: ['ol'] }));
  if (tags.has('button')) pool.push(rule('Dla selektora przycisku', 'button', [['background-color', P.mid], ['color', 'white'], ['padding', rng.pick(['5px', '8px', '10px'])], ['border', 'none'], ['border-radius', rng.pick(['5px', '10px', '20px'])], ['cursor', 'pointer']], { tags: ['button'] }));
  if (tags.has('input')) pool.push(rule('Dla selektora pola input', 'input', [['margin', rng.pick(['5px', '10px'])]], { tags: ['input'] }));
  const tagCount = Math.min(pool.length, rng.int(2, 3));
  tagRules.push(...rng.sample(pool, tagCount));
  for (const r of tagRules) r.tags.forEach((t) => tagOnly.add(t));
  rules.push(...tagRules);

  // 4b. Odnośniki jedynie w bloku nawigacyjnym (selektor potomka) - częsty element zasad oceniania
  const navLinksWidget = site.rendered.find((r) => r.block === 'nav' && r.widget.id === 'navLinks' && !r.state.asHeadings);
  let navLinkRule = null;
  if (navLinksWidget && rng.chance(0.55)) {
    navLinkRule = rule('Dla odnośników jedynie w bloku nawigacyjnym', 'nav a', [['display', 'inline-block'], ['background-color', P.lighter], ['color', P.dark], ['padding', rng.pick(['5px', '10px'])], ['margin', rng.pick(['5px', '10px'])], ['border-radius', rng.pick(['10px', '20px'])], ['text-decoration', 'none']]);
    rules.push(navLinkRule);
  }

  // 5. Klasy przypisane przez widżety
  for (const c of site.classes) {
    const decls = c.tag === 'img'
      ? [['width', c.thumb ? rng.pick(['100px', '120px']) : rng.pick(['150px', '200px'])], ['margin', '5px'], ['border', `2px ${rng.pick(['solid', 'dotted', 'dashed'])} ${P.dark}`], ['border-radius', rng.pick(['8px', '50%'])], ...(c.thumb ? [['cursor', 'pointer']] : [])]
      : [['display', 'inline-block'], ['width', rng.pick(['28%', '40%', '200px'])], ['vertical-align', 'top'], ['background-color', P.lighter], ['margin', '10px'], ['padding', '10px'], ['border-radius', '10px'], ['box-shadow', `${rng.pick(['3px', '5px'])} ${rng.pick(['3px', '5px'])} ${rng.pick(['5px', '10px'])} ${P.accent}`]];
    rules.push(rule(`Dla klasy ${c.name} (${c.descPl})`, `.${c.name}`, decls));
  }

  // 6. Pseudoklasa :hover
  const hovers = [];
  if (tags.has('tr')) hovers.push(rule('Gdy kursor znajdzie się na wierszu tabeli', 'tr:hover', [['background-color', P.light === bgs[0] ? P.accent : P.mid]], { hover: 'jego kolor tła zmienia się na' }));
  if (tags.has('a')) hovers.push(rule('Gdy kursor znajdzie się na odnośniku', 'a:hover', [['color', P.accent]], { hover: 'kolor jego czcionki zmienia się na' }));
  if (tags.has('button')) hovers.push(rule('Gdy kursor znajdzie się na przycisku', 'button:hover', [['background-color', 'white'], ['color', P.dark]], { hover: 'jego kolor tła zmienia się na biały, a kolor czcionki na' }));
  if (tags.has('img')) hovers.push(rule('Gdy kursor znajdzie się na obrazie', 'img:hover', [['opacity', '0.7']], { hover: 'jego przezroczystość zmienia się na' }));
  if (navLinkRule) {
    rules.push(rule('Gdy kursor znajdzie się na odnośniku w bloku nawigacyjnym', 'nav a:hover', [['background-color', P.dark], ['color', 'white'], ['border', `1px solid ${P.lighter}`]], { hover: 'jego kolor tła zmienia się na ' + P.dark + ', kolor czcionki na biały oraz pojawia się obramowanie 1 px linią ciągłą w kolorze', hoverLast: P.lighter }));
  } else if (hovers.length) rules.push(rng.pick(hovers));

  // Reguły układu - nieopisywane w arkuszu, wynikają z ilustracji układu bloków.
  const layoutCss = `${mains.map(sel).join(', ')} {\n    float: left;\n}\n\nfooter {\n    clear: both;\n}`;
  return {
    palette: P, font,
    rules,
    tagOnly: [...tagOnly],
    text: rules.map(ruleText),
    css: `${rules.map(ruleCss).join('\n\n')}\n\n/* układ bloków */\n${layoutCss}\n`,
  };
}

export function ruleText(r) {
  if (r.hover) {
    const last = r.hoverLast || r.decls[r.decls.length - 1][1];
    return `${r.target} ${r.hover} ${colorPl(last)}`;
  }
  return `${r.target}: ${r.decls.map(([p, v]) => declPl(p, v)).join(', ')}`;
}

export function ruleCss(r) {
  return `${r.selector} {\n${r.decls.map(([p, v]) => `    ${p}: ${v};`).join('\n')}\n}`;
}

export function tagOnlyNote(tagOnly) {
  if (!tagOnly.length) return '';
  const names = tagOnly.map((t) => TAG_GEN[t]).filter(Boolean);
  return `Uwaga: styl CSS ${joinPl(names)} należy zdefiniować wyłącznie przy pomocy selektora ${names.length > 1 ? 'tych znaczników' : 'tego znacznika'}. Jest to uwarunkowane projektem późniejszej rozbudowy witryny.`;
}
