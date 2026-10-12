// Wymiary grafik dopasowane do strony: szerokość strony (lub szerokość projektowa 1200 px)
// i szerokość bloku, w którym stoi obraz, wyznaczają docelowe wymiary plików.
// Z tych wymiarów korzystają zadania graficzne, obrazy zastępcze i zdjęcia z Pixabay.

const round10 = (v) => Math.max(10, Math.round(v / 10) * 10);

export function computeImageSizes(site, css, pageWidth) {
  const pagePx = pageWidth && pageWidth !== 'full' ? Number(pageWidth) : 1200;
  const blockPx = {};
  for (const row of site.rows) row.blocks.forEach((b, i) => { blockPx[b] = (pagePx * row.widths[i]) / 100; });
  const pxOf = (selector) => {
    const r = css.rules.find((x) => x.selector === selector && !x.media);
    const w = r && r.decls.find(([p]) => p === 'width');
    return w && /^\d+px$/.test(w[1]) ? Number(w[1].slice(0, -2)) : null;
  };
  const imgTagPx = pxOf('img');
  const sizes = {};
  for (const r of site.rendered) {
    const files = r.out.files || [];
    if (!files.length) continue;
    const bpx = blockPx[r.block] || pagePx / 3;
    const classPx = (r.out.classes || []).map((c) => pxOf(`.${c.name}`)).find(Boolean);
    for (const f of files) {
      if (sizes[f]) continue;
      if (r.widget.id === 'image' && site.defs[r.block].kind === 'head') {
        const row = site.rows.find((x) => x.blocks.includes(r.block));
        const hgt = Math.max(60, (row.height || 100) - 20);
        sizes[f] = { w: hgt, h: hgt, block: r.block, blockPx: bpx, note: `wysokość banera ${row.height || 100} px` };
      } else if (classPx) {
        sizes[f] = { w: classPx, h: round10(classPx * 0.75), block: r.block, blockPx: bpx, from: 'css' };
      } else if (imgTagPx) {
        sizes[f] = { w: imgTagPx, h: round10(imgTagPx * 0.75), block: r.block, blockPx: bpx, from: 'css' };
      } else {
        const w = round10(Math.min(bpx * (r.widget.id === 'image' ? 0.9 : 0.8), r.widget.id === 'image' ? 640 : 400));
        sizes[f] = { w, h: round10(w * 2 / 3), block: r.block, blockPx: bpx, from: 'block' };
      }
    }
  }
  return { sizes, pagePx, blockPx, fixed: Boolean(pageWidth && pageWidth !== 'full') };
}
