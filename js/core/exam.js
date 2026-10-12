// Orkiestrator: z ustawień i ziarna (seed) tworzy kompletny model arkusza egzaminacyjnego INF.03:
// treść zadania, bazę danych, rozwiązanie wzorcowe oraz kryteria oceniania.
import { Rng } from './rng.js';
import { THEMES, getTheme } from './themes.js';
import { buildDatabase, buildDump, schemaSvg } from './db.js';
import { schemaInfo } from './queries.js';
import { toSql, describe, execute } from './sql.js';
import { buildSite, pageHtml, layoutSvg } from './site.js';
import { buildCss, tagOnlyNote } from './css.js';
import { buildGraphics, buildAnimation } from './graphics.js';
import { buildGrading } from './grading.js';
import { computeImageSizes } from './sizing.js';

export const MODES = {
  server: 'Baza danych + skrypty PHP (styczeń)',
  client: 'Baza danych + skrypty JavaScript (czerwiec)',
  mixed: 'Baza danych + skrypty PHP i JavaScript',
  animation: 'Animacja GIF + skrypty JavaScript',
};

export const TECHNIQUES = { float: 'float (opływanie)', flex: 'flexbox', grid: 'grid (siatka)' };

export const DEFAULTS = {
  theme: 'random', mode: 'random', difficulty: 'normal', queryCount: 'auto', graphics: 'random', year: 2026, month: '06',
  layout: 'random', technique: 'random', responsive: 'random', pseudo: 'random', pageWidth: 'random',
};

const pickOpt = (value, rng, choices) => (value === 'random' || value === undefined ? rng.weighted(choices) : value);

export function randomSeed() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function makePassword(theme, rng) {
  const base = rng.pick(theme.passWords);
  const sym = rng.pick(['!', '#', '@', '%', '^', '*', '+', '$']);
  return rng.chance(0.5) ? `${base}${sym}${rng.int(1, 99)}` : `${sym}${base}${rng.int(10, 99)}`;
}

export function generateExam(input = {}) {
  const opts = { ...DEFAULTS, ...input };
  const seed = String(opts.seed || randomSeed()).trim().toUpperCase();
  const rng = new Rng(`${seed}|${opts.theme}|${opts.mode}|${opts.difficulty}|${opts.queryCount}|${opts.graphics}`);

  const theme = opts.theme === 'random' ? rng.fork('theme').pick(THEMES) : getTheme(opts.theme);
  if (!theme) throw new Error(`Nieznany temat: ${opts.theme}`);
  const mode = opts.mode === 'random' ? rng.fork('mode').weighted([['server', 5], ['client', 4], ['mixed', 2], ['animation', 1]]) : opts.mode;
  // opcje wyglądu losowane z osobnych strumieni - nie zmieniają reszty arkusza
  const technique = pickOpt(opts.technique, rng.fork('tech'), [['float', 5], ['flex', 3], ['grid', 2]]);
  const responsive = pickOpt(opts.responsive, rng.fork('resp'), [['no', 4], ['yes', 1]]) === 'yes';
  const pseudo = pickOpt(opts.pseudo, rng.fork('pseudo'), [['standard', 2], ['extended', 1]]);
  const pageWidth = pickOpt(opts.pageWidth, rng.fork('pw'), [['full', 3], ['1000', 1], ['1200', 1]]);
  const difficulty = opts.difficulty;
  const hasDb = mode !== 'animation';
  const queryCount = opts.queryCount === 'auto' ? (difficulty === 'hard' ? 5 : rng.fork('qc').pick([4, 4, 5])) : Number(opts.queryCount);

  const db = buildDatabase(theme, rng.fork('db'));
  const ctx = { theme, db, rng: rng.fork('site'), S: schemaInfo(theme) };
  const animation = mode === 'animation' ? buildAnimation(theme, rng.fork('anim')) : null;
  const site = buildSite(ctx, { mode: mode === 'animation' ? 'client' : mode, difficulty, queryCount: hasDb ? queryCount : 0, animation, layoutId: opts.layout, technique });
  const css = buildCss(site, rng.fork('css'), { responsive, pseudo, pageWidth });
  const sizing = computeImageSizes(site, css, pageWidth);
  const withGraphics = opts.graphics === 'random' ? rng.fork('gfx').chance(0.5) : Boolean(opts.graphics === true || opts.graphics === 'yes');
  const graphics = withGraphics ? buildGraphics(theme, rng.fork('gfx2'), site, sizing) : null;

  const taskNo = String(rng.fork('no').int(1, 12)).padStart(2, '0');
  const yy = String(opts.year).slice(-2);
  const code = `INF.03-${taskNo}-${yy}.${opts.month}-SG`;
  const screenshotFmt = rng.fork('fmt').pick([['PNG', 'png'], ['JPEG', 'jpg']]);
  const importFmt = rng.fork('fmt2').pick([['PNG', 'png'], ['JPEG', 'jpg']]);

  const queries = hasDb ? site.queries.map((ref) => {
    const spec = ref.result.spec;
    return {
      number: ref.number,
      pattern: ref.result.pattern,
      group: ref.result.group,
      usedBy: ref.usedBy,
      spec,
      sql: toSql(spec),
      text: describe(spec),
      result: execute(spec, db, { rng: rng.fork(`res${ref.number}`) }),
    };
  }) : [];

  const archive = { name: `pliki${rng.fork('arch').int(1, 25)}`, password: makePassword(theme, rng.fork('pass')) };

  // --- pliki wynikowe zdającego ---
  const imageFiles = collectImages(site, theme, graphics, animation);
  const resultFiles = [
    ...(hasDb ? [`import.${importFmt[1]}`, ...queries.map((x) => `kw${x.number}.${screenshotFmt[1]}`), 'kwerendy.txt'] : []),
    ...(animation ? [animation.file, 'parametry.jpg'] : []),
    ...site.pages.map((p) => p.file),
    'styl.css',
    ...(site.js ? ['skrypt.js'] : []),
    ...imageFiles,
    'przeglądarka.txt',
  ];
  const resultFilesSorted = [...new Set(resultFiles)].sort((a, b) => a.localeCompare(b, 'pl'));

  const results = [
    hasDb ? 'operacje na bazie danych' : 'animacja',
    'zawartość witryny internetowej',
    'działanie witryny internetowej',
    'styl CSS witryny internetowej',
    mode === 'server' ? (site.scripts.length > 1 ? 'skrypty połączenia z bazą' : 'skrypt połączenia z bazą') : (site.scripts.length > 1 ? 'skrypty' : 'skrypt'),
  ];

  const exam = {
    seed, options: opts, code, taskNo, theme, mode, difficulty, hasDb,
    archive, db, dump: buildDump(db), schemaSvg: schemaSvg(theme), queries,
    site, css, cssNote: tagOnlyNote(css.tagOnly), graphics, animation, sizing,
    style: { technique: site.technique, responsive, pseudo, pageWidth, layout: site.layout.id },
    screenshotFmt, importFmt,
    layoutSvg: layoutSvg(site),
    imageFiles, resultFiles: resultFilesSorted, results,
  };
  exam.solution = buildSolution(exam);
  exam.criteria = buildGrading(exam);
  return exam;
}

function collectImages(site, theme, graphics, animation) {
  const set = new Set(site.files);
  if (graphics) graphics.files.forEach((f) => set.add(f));
  if (animation) set.delete(animation.file);
  return [...set];
}

function buildSolution(exam) {
  const { site, theme } = exam;
  const files = {};
  site.pages.forEach((p, i) => {
    files[p.file] = pageHtml(site, theme, { page: i });
  });
  files['styl.css'] = exam.css.css;
  if (site.js) files['skrypt.js'] = `${site.js}\n`;
  if (exam.hasDb) files['kwerendy.txt'] = exam.queries.map((x) => `-- Zapytanie ${x.number}\n${x.sql}`).join('\n\n') + '\n';
  files['przeglądarka.txt'] = 'Google Chrome\n';
  return files;
}
