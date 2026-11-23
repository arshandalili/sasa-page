/* Result charts and the qualitative explorers for the SASA page.
 * Every number is copied from the paper's tables (Tables 1, 2, 5-11, 13-15), and the per-token
 * group norms are read from the vector data of the paper's activation-profile figures.
 */
(function () {
  'use strict';
  const U = window.SasaUtil;
  const { $, $$, svgEl, text, mathText, tex, fmt, esc, clamp, REDUCED, responsive, sizeSvg, ticks, tip, bindTip, setTabs, hbar, vbar, marker, MODELS, legend } = U;
  const ORDER = ['topk', 'btk', 'mat', 'sasa'];

  // ── data ───────────────────────────────────────────────────────────────────────────────────
  // Table 1: GPT-2 layer 7, 24,576 decoder columns, ℓ0 = 120; mean ± sd over three seeds
  const T1 = {
    topk: { ce: [99.6, 0], flm: [21.7, 3.0], flf: [22.8, 2.1], fam: [52.7, 18.0], faf: [25.0, 14.4], mp: [63.8, 0.9], ai: [86.3, 0.2] },
    btk: { ce: [99.7, 0], flm: [25.3, 2.3], flf: [21.4, 2.1], fam: [55.2, 1.4], faf: [29.6, 8.7], mp: [68.9, 1.8], ai: [87.7, 0.4] },
    mat: { ce: [99.6, 0], flm: [37.5, 3.5], flf: [35.0, 5.0], fam: [46.4, 3.6], faf: [25.2, 3.1], mp: [62.8, 1.7], ai: [88.4, 0.2] },
    sasa: { ce: [98.7, 0], flm: [11.3, 0.9], flf: [8.7, 0.6], fam: [23.9, 4.4], faf: [10.9, 4.0], mp: [86.2, 0.5], ai: [83.2, 0.5] },
  };
  // Tables 5-7: absorption across sparsity (ℓ0 = 60, 120, 240) and dictionary width
  const WG = {
    flm: {
      12288: { topk: [[11.0, 0.5], [13.8, 1.6], [15.4, 1.5]], btk: [[18.5, 1.5], [31.7, 2.9], [35.9, 1.5]], mat: [[15.3, 2.1], [38.4, 1.6], [35.8, 3.8]], sasa: [[15.9, 1.4], [15.1, 1.3], [14.8, 2.4]] },
      24576: { topk: [[11.6, 0.6], [21.7, 3.0], [23.1, 1.5]], btk: [[9.1, 0.2], [25.3, 2.3], [32.4, 2.1]], mat: [[17.9, 1.9], [37.5, 3.5], [52.1, 1.9]], sasa: [[10.7, 0.2], [11.3, 0.9], [21.5, 2.5]] },
      49152: { topk: [[12.0, 0.3], [13.2, 0.4], [19.3, 0.8]], btk: [[10.6, 0.1], [14.5, 2.0], [43.5, 2.8]], mat: [[15.4, 1.2], [33.6, 3.6], [41.6, 3.1]], sasa: [[15.6, 1.1], [16.6, 0.2], [14.0, 3.1]] },
    },
    flf: {
      12288: { topk: [[17.0, 0.5], [14.5, 2.2], [11.1, 1.5]], btk: [[20.7, 2.3], [28.8, 5.4], [32.6, 1.4]], mat: [[16.0, 2.0], [33.4, 1.9], [28.3, 5.8]], sasa: [[14.5, 0.3], [9.7, 0.4], [7.2, 0.7]] },
      24576: { topk: [[22.0, 0.9], [22.8, 2.1], [17.8, 1.4]], btk: [[14.8, 0.2], [21.4, 2.1], [28.1, 0.9]], mat: [[19.3, 1.2], [35.0, 5.0], [46.6, 3.0]], sasa: [[16.3, 0.3], [8.7, 0.6], [7.8, 1.9]] },
      49152: { topk: [[25.5, 0.0], [17.9, 0.5], [16.0, 1.8]], btk: [[19.0, 0.3], [16.7, 3.5], [33.6, 3.9]], mat: [[17.9, 1.0], [27.8, 3.7], [36.8, 3.1]], sasa: [[17.3, 0.7], [10.9, 0.2], [6.4, 1.0]] },
    },
    fam: {
      12288: { topk: [[43.4, 10.1], [49.7, 4.1], [59.1, 9.4]], btk: [[48.1, 6.0], [52.2, 3.6], [61.9, 5.6]], mat: [[45.9, 8.3], [51.0, 10.7], [73.2, 7.3]], sasa: [[5.5, 2.2], [25.5, 5.0], [36.6, 8.3]] },
      24576: { topk: [[49.2, 9.2], [52.7, 18.0], [54.3, 4.0]], btk: [[48.8, 9.6], [55.2, 1.4], [65.9, 2.3]], mat: [[32.0, 6.5], [46.4, 3.6], [59.4, 3.7]], sasa: [[5.5, 2.6], [23.9, 4.4], [45.7, 3.1]] },
      49152: { topk: [[38.7, 2.7], [50.2, 3.0], [58.6, 3.9]], btk: [[54.7, 7.9], [65.1, 9.1], [65.9, 11.3]], mat: [[29.1, 3.6], [49.6, 1.8], [66.9, 9.9]], sasa: [[13.7, 0.7], [31.5, 1.4], [58.1, 6.8]] },
    },
  };
  // Tables 8, 9: the 12,288-column sweep (ℓ0 = 30, 60, 120, 240)
  const SW = {
    ce: { topk: [98.7, 99.2, 99.5, 99.8], btk: [98.8, 99.3, 99.6, 99.8], mat: [98.7, 99.2, 99.5, 99.8], sasa: [95.8, 97.3, 98.5, 99.3] },
    fam: { topk: [[46.8, 10.0], [43.4, 10.1], [49.7, 4.1], [59.1, 9.4]], btk: [[37.3, 5.7], [48.1, 6.0], [52.2, 3.6], [61.9, 5.6]], mat: [[26.5, 13.0], [45.9, 8.3], [51.0, 10.7], [73.2, 7.3]], sasa: [[7.9, 0.9], [5.5, 2.2], [25.5, 5.0], [36.6, 8.3]] },
    mp6: { topk: [[51.6, 1.0], [66.1, 0.7], [66.1, 0.5], [65.8, 0.5]], btk: [[48.5, 1.2], [56.0, 2.1], [63.0, 0.3], [46.1, 2.1]], mat: [[52.7, 0.9], [59.9, 1.5], [57.7, 1.1], [35.4, 1.2]], sasa: [[69.2, 0.2], [77.7, 0.9], [78.2, 1.1], [68.0, 1.5]] },
    mp24: { topk: [[51.6, 1.0], [67.8, 0.8], [84.4, 0.7], [81.3, 0.3]], btk: [[48.5, 1.2], [60.0, 1.6], [84.5, 0.1], [54.3, 1.2]], mat: [[52.7, 0.9], [76.9, 1.1], [66.8, 1.6], [36.8, 1.7]], sasa: [[69.7, 0.4], [87.0, 0.8], [95.7, 0.6], [87.6, 1.0]] },
  };
  const L0SW = [30, 60, 120, 240];

  // ── a horizontal dot plot with error bars, one row per model ─────────────────────────────
  function dotRows(svg, fig, W, avail, rows, o) {
    const labW = o.labW || 104, top = o.title ? 34 : 12, rowH = 30, bottom = 40, right = 16;
    const H = top + rowH * rows.length + bottom;
    sizeSvg(svg, W, H, avail); svg.innerHTML = '';
    const X = v => labW + (v - o.lo) / (o.hi - o.lo) * (W - labW - right);
    if (o.title) text(svg, labW, 16, o.title, 'ptitle');
    ticks(o.lo, o.hi, W < 420 ? 3 : 5).ticks.forEach(t => {
      svgEl('line', { x1: X(t), x2: X(t), y1: top - 4, y2: top + rowH * rows.length, class: t === 0 ? 'axis' : 'grid' }, svg);
      text(svg, X(t), top + rowH * rows.length + 16, fmt(t, o.td || 0), 'tick', 'middle');
    });
    text(svg, X(o.lo), top + rowH * rows.length + 33, o.axis, 'alabel', 'start');
    rows.forEach((rw, r) => {
      const y = top + r * rowH + rowH / 2, m = MODELS[rw.k], g = svgEl('g', { class: 'row' }, svg), ours = rw.k === 'sasa';
      svgEl('rect', { x: 0, y: y - rowH / 2 + 1, width: W, height: rowH - 2, class: 'hl', rx: 4 }, g);
      text(g, labW - 12, y + 4.5, m.name, 'mlabel' + (ours ? ' ours' : ''), 'end');
      const [mu, sd] = rw.v;
      if (o.bars) svgEl('path', { d: hbar(X(o.lo), y - 7, X(mu) - X(o.lo), 14), fill: m.color, opacity: ours ? 1 : 0.9 }, g);
      if (sd > 0) svgEl('line', { x1: X(mu - sd), x2: X(mu + sd), y1: y, y2: y, class: 'err', stroke: o.bars ? 'var(--ink)' : m.color }, g);
      if (!o.bars) marker(g, m.shape, X(mu), y, ours ? 6 : 5, { fill: m.color, stroke: 'var(--bg)', 'stroke-width': 1.5 });
      const lab = fmt(mu, 1) + (sd > 0 ? ' ± ' + fmt(sd, 1) : ''), lw = lab.length * 6.6 + 4;
      const rx = Math.max(X(mu + sd), X(mu) + (o.bars ? 0 : 6)) + 8;
      if (rx + lw <= W - 2) text(g, rx, y + 4, lab, 'vlabel' + (ours ? ' ours' : ''));
      else if (o.bars) text(g, X(mu) - 8, y + 4, lab, 'vlabel inbar', 'end');
      else text(g, Math.min(X(mu - sd), X(mu) - 6) - 8, y + 4, lab, 'vlabel' + (ours ? ' ours' : ''), 'end');
      const hit = svgEl('rect', { x: 0, y: y - rowH / 2, width: W, height: rowH, class: 'hit' }, g);
      hit.setAttribute('aria-label', `${m.name}: ${fmt(mu, 1)}${sd > 0 ? ' plus or minus ' + fmt(sd, 1) : ''}`);
      bindTip(hit, fig, () => `<b>${esc(m.name)}</b><div class="row"><span>${esc(o.metric)}</span><b>${fmt(mu, 1)}${sd > 0 ? ' ± ' + fmt(sd, 1) : ''}</b></div>`);
    });
  }

  // Table 1 as a chart, one metric at a time
  function matched(fig) {
    const METRICS = {
      fl: { label: 'First-letter absorption', panels: [['flm', 'Mean absorption (%)'], ['flf', 'Full absorption (%)']], lo: 0, hi: 45, better: 'lower is better' },
      fam: { label: 'Family absorption', panels: [['fam', 'Mean absorption (%)'], ['faf', 'Full absorption (%)']], lo: 0, hi: 75, better: 'lower is better' },
      mp: { label: 'Member prediction', panels: [['mp', 'Accuracy (%)']], lo: 0, hi: 100, better: 'higher is better', bars: true },
      ce: { label: 'CE score', panels: [['ce', 'CE score (%), axis starts at 98']], lo: 98, hi: 100, better: 'higher is better', td: 1 },
      ai: { label: 'AutoInterp', panels: [['ai', 'Prediction accuracy (%), axis starts at 80']], lo: 80, hi: 90, better: 'higher is better' },
    };
    fig.innerHTML = `
      <div class="fig-controls"><div class="tabs" role="tablist" aria-label="metric">${Object.entries(METRICS).map(([k, m], i) => `<button type="button" class="tab${i ? '' : ' on'}" data-metric="${k}">${m.label}</button>`).join('')}</div></div>
      ${legend(ORDER)}
      <div class="panels"></div>
      <details class="data"><summary>Table view</summary><div class="tbl"></div></details>`;
    const host = $('.panels', fig);
    let metric = 'fl', W = 640, avail = 640;
    function render() {
      const M = METRICS[metric], two = M.panels.length > 1 && W >= 600;
      host.innerHTML = ''; host.classList.toggle('two', two);
      const pw = two ? Math.floor((W - 24) / 2) : W;
      M.panels.forEach(([key, axis]) => {
        const d = document.createElement('div'); d.className = 'panel'; host.appendChild(d);
        const svg = svgEl('svg', { class: 'chart', role: 'img', 'aria-label': `${M.label}, ${axis}, ${M.better}` }, d);
        const rows = ORDER.map(k => ({ k, v: T1[k][key] }));
        dotRows(svg, fig, pw, pw, rows, { lo: M.lo, hi: M.hi, axis: `${axis}, ${M.better}`, metric: axis, bars: M.bars, td: M.td, labW: 96 });
      });
    }
    function table() {
      const cols = [['ce', 'CE score'], ['flm', 'First-letter mean'], ['flf', 'First-letter full'], ['fam', 'Family mean'], ['faf', 'Family full'], ['mp', 'Member prediction'], ['ai', 'AutoInterp']];
      let h = `<table class="dt"><thead><tr><th>Model</th>${cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>`;
      ORDER.forEach(k => { h += `<tr${k === 'sasa' ? ' class="ours"' : ''}><td>${MODELS[k].name}</td>${cols.map(([c]) => { const [m, s] = T1[k][c]; return `<td>${fmt(m, 1)}${s ? ` <span class="pm">± ${fmt(s, 1)}</span>` : ''}</td>`; }).join('')}</tr>`; });
      $('.tbl', fig).innerHTML = `<div class="scroll-x">${h}</tbody></table></div>`;
    }
    $$('button[data-metric]', fig).forEach(b => b.addEventListener('click', () => { metric = b.dataset.metric; setTabs(fig, 'metric', metric); render(); }));
    table();
    responsive(host, 300, (w, a) => { W = w; avail = a; render(); });
  }

  // ── line chart across sparsity levels ──────────────────────────────────────────────────────
  function lineChart(svg, fig, W, avail, o) {
    const H = o.H || 300, l = 46, r = W < 460 ? 18 : (o.rightPad || 92), top = o.ylab ? 30 : 14, b = 44;
    sizeSvg(svg, W, H, avail); svg.innerHTML = '';
    const n = o.xs.length, X = i => l + (o.pad || 0.5) * (W - l - r) / n + i * (W - l - r) * (1 - 2 * (o.pad || 0.5) / n) / (n - 1);
    const Y = v => o.log ? top + (1 - (Math.log10(v) - Math.log10(o.lo)) / (Math.log10(o.hi) - Math.log10(o.lo))) * (H - top - b)
      : top + (1 - (v - o.lo) / (o.hi - o.lo)) * (H - top - b);
    (o.yticks || ticks(o.lo, o.hi, 5).ticks).forEach(t => {
      svgEl('line', { x1: l, x2: W - r + (W < 460 ? 0 : 10), y1: Y(t), y2: Y(t), class: t === o.lo && !o.log ? 'axis' : 'grid' }, svg);
      text(svg, l - 8, Y(t) + 4, o.tfmt ? o.tfmt(t) : String(t), 'tick', 'end');
    });
    o.xs.forEach((x, i) => text(svg, X(i), H - b + 18, String(x), 'tick', 'middle'));
    if (o.ylab) text(svg, l - 40, 12, o.ylab, 'alabel');
    if (o.xlabel) { const parts = o.xlabel; mathText(svg, (l + W - r) / 2, H - 6, parts, 'alabel', 'middle'); }
    const ends = [];
    o.series.forEach(s => {
      const m = s.k ? MODELS[s.k] : s, ours = s.k === 'sasa', col = s.color || m.color, dx = s.dx || 0, XX = i => X(i) + dx;
      const g = svgEl('g', {}, svg);
      let d = ''; s.v.forEach((v, i) => { if (v == null) return; const y = Y(Array.isArray(v) ? v[0] : v); d += (d ? 'L' : 'M') + XX(i).toFixed(1) + ',' + y.toFixed(1); });
      svgEl('path', { d, fill: 'none', stroke: col, 'stroke-width': ours || s.bold ? 2.6 : 1.8, 'stroke-dasharray': s.dash || null, 'stroke-linejoin': 'round' }, g);
      s.v.forEach((v, i) => {
        if (v == null) return;
        const [mu, sd] = Array.isArray(v) ? v : [v, 0];
        if (sd > 0) {
          const y1 = Y(Math.max(o.log ? o.lo : o.lo, mu - sd)), y2 = Y(Math.min(o.hi, mu + sd));
          svgEl('line', { x1: XX(i), x2: XX(i), y1, y2, stroke: col, 'stroke-width': 1.4, opacity: 0.55, 'stroke-linecap': 'round' }, g);
        }
        marker(g, s.shape || m.shape, XX(i), Y(mu), ours ? 5.5 : 4.6, { fill: s.hollow ? 'var(--bg)' : col, stroke: s.hollow ? col : 'var(--bg)', 'stroke-width': s.hollow ? 1.8 : 1.5 });
        const hit = svgEl('rect', { x: XX(i) - 13, y: Y(mu) - 13, width: 26, height: 26, class: 'hit' }, g);
        const lab = s.name || m.name;
        hit.setAttribute('aria-label', `${lab}, ${o.xname} ${o.xs[i]}: ${fmt(mu, o.vd ?? 1)}${sd > 0 ? ' plus or minus ' + fmt(sd, o.vd ?? 1) : ''}`);
        bindTip(hit, fig, () => `<b>${esc(lab)}</b> <span class="sub">· ${esc(o.xname)} ${o.xs[i]}</span><div class="row"><span>${esc(o.metric)}</span><b>${fmt(mu, o.vd ?? 1)}${sd > 0 ? ' ± ' + fmt(sd, o.vd ?? 1) : ''}</b></div>`);
      });
      const li = s.v.length - 1 - [...s.v].reverse().findIndex(v => v != null), lv = s.v[li];
      ends.push({ y: Y(Array.isArray(lv) ? lv[0] : lv), name: s.short || s.name || m.name, ours, x: XX(li) });
    });
    // direct labels at the right, nudged apart
    if (W >= 460) {
      ends.sort((a, b2) => a.y - b2.y);
      for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
      for (let i = ends.length - 2; i >= 0; i--) if (ends[i].y > ends[i + 1].y - 14) ends[i].y = ends[i + 1].y - 14;
      ends.forEach(e => text(svg, e.x + 12, e.y + 4, e.name, 'mlabel' + (e.ours ? ' ours' : '')));
    }
    return { X, Y, H };
  }

  // Tables 5 and 7: absorption across sparsity and dictionary width
  function sweep(fig) {
    const MET = { flm: 'First-letter, mean', flf: 'First-letter, full', fam: 'Concept families, mean' };
    fig.innerHTML = `
      <div class="fig-controls">
        <div class="tabs" role="tablist" aria-label="metric">${Object.entries(MET).map(([k, v], i) => `<button type="button" class="tab${i ? '' : ' on'}" data-met="${k}">${v}</button>`).join('')}</div>
        <div class="tabs" role="tablist" aria-label="dictionary width">${[12288, 24576, 49152].map(w => `<button type="button" class="tab${w === 24576 ? ' on' : ''}" data-w="${w}">${U.commas(w)} columns</button>`).join('')}</div>
      </div>
      ${legend(ORDER)}
      <div class="chart-host"><svg class="chart" role="img"></svg></div>
      <details class="data"><summary>Table view</summary><div class="tbl"></div></details>`;
    const svg = $('svg.chart', fig), host = $('.chart-host', fig);
    let met = 'flm', wd = 24576, W = 640, avail = 640;
    function render() {
      const D = WG[met][wd];
      svg.setAttribute('aria-label', `${MET[met]} absorption at ${U.commas(wd)} columns across sparsity`);
      lineChart(svg, fig, W, avail, {
        xs: [60, 120, 240], xname: 'ℓ₀ =', xlabel: [{ t: 'target sparsity ' }, { m: 'ℓ' }, { s: '0' }, { t: ' (active scalar coordinates per token)' }],
        lo: 0, hi: 80, metric: `${MET[met]} absorption (%)`, tfmt: t => t + '%', ylab: 'absorption, lower is better',
        series: ORDER.map(k => ({ k, v: D[k] })),
      });
      let h = `<table class="dt"><caption>${MET[met]} absorption (%), ${U.commas(wd)} decoder columns</caption><thead><tr><th>Model</th><th>ℓ₀ = 60</th><th>ℓ₀ = 120</th><th>ℓ₀ = 240</th></tr></thead><tbody>`;
      ORDER.forEach(k => { h += `<tr${k === 'sasa' ? ' class="ours"' : ''}><td>${MODELS[k].name}</td>${D[k].map(([m, s]) => `<td>${fmt(m, 1)} <span class="pm">± ${fmt(s, 1)}</span></td>`).join('')}</tr>`; });
      $('.tbl', fig).innerHTML = h + '</tbody></table>';
    }
    $$('button[data-met]', fig).forEach(b => b.addEventListener('click', () => { met = b.dataset.met; setTabs(fig, 'met', met); render(); }));
    $$('button[data-w]', fig).forEach(b => b.addEventListener('click', () => { wd = +b.dataset.w; setTabs(fig, 'w', wd); render(); }));
    responsive(host, 320, (w, a) => { W = w; avail = a; render(); });
  }

  // Table 8: reconstruction against family absorption or member prediction, 12,288 columns
  function tradeoff(fig) {
    fig.innerHTML = `
      <div class="fig-controls"><div class="tabs" role="tablist" aria-label="y axis">
        <button type="button" class="tab on" data-y="fam">Family absorption</button><button type="button" class="tab" data-y="mp6">Member prediction</button></div>
        <span class="hint">SASA points are labeled with the target ℓ₀</span></div>
      ${legend(ORDER)}
      <div class="chart-host"><svg class="chart" role="img"></svg></div>
      <details class="data"><summary>Table view</summary><div class="tbl"></div></details>`;
    const svg = $('svg.chart', fig), host = $('.chart-host', fig);
    let ym = 'fam', W = 640, avail = 640;
    function render() {
      const H = 320, l = 50, r = 12, top = 14, b = 46, xlo = 95.5, xhi = W < 520 ? 100.05 : 100.62;
      sizeSvg(svg, W, H, avail); svg.innerHTML = '';
      const ylo = 0, yhi = ym === 'fam' ? 80 : 100;
      const X = v => l + (v - xlo) / (xhi - xlo) * (W - l - r), Y = v => top + (1 - (v - ylo) / (yhi - ylo)) * (H - top - b);
      ticks(ylo, yhi, 5).ticks.forEach(t => { svgEl('line', { x1: l, x2: W - r, y1: Y(t), y2: Y(t), class: t ? 'grid' : 'axis' }, svg); text(svg, l - 8, Y(t) + 4, t + '%', 'tick', 'end'); });
      [96, 97, 98, 99, 100].forEach(t => { svgEl('line', { x1: X(t), x2: X(t), y1: top, y2: H - b, class: 'grid' }, svg); text(svg, X(t), H - b + 17, t + '%', 'tick', X(t) > W - 24 ? 'end' : 'middle'); });
      text(svg, (l + W - r) / 2, H - 8, 'CE score, higher means better reconstruction', 'alabel', 'middle');
      svg.setAttribute('aria-label', `CE score against ${ym === 'fam' ? 'family absorption' : 'member prediction'} at 12,288 columns`);
      ORDER.forEach(k => {
        const m = MODELS[k], ours = k === 'sasa', g = svgEl('g', {}, svg);
        let d = '';
        SW.ce[k].forEach((c, i) => { d += (i ? 'L' : 'M') + X(c).toFixed(1) + ',' + Y(SW[ym][k][i][0]).toFixed(1); });
        svgEl('path', { d, fill: 'none', stroke: m.color, 'stroke-width': ours ? 2.6 : 1.6, 'stroke-linejoin': 'round', opacity: ours ? 1 : 0.85 }, g);
        SW.ce[k].forEach((c, i) => {
          const [mu, sd] = SW[ym][k][i];
          svgEl('line', { x1: X(c), x2: X(c), y1: Y(Math.max(0, mu - sd)), y2: Y(Math.min(yhi, mu + sd)), stroke: m.color, 'stroke-width': 1.3, opacity: 0.5 }, g);
          marker(g, m.shape, X(c), Y(mu), ours ? 5.5 : 4.4, { fill: m.color, stroke: 'var(--bg)', 'stroke-width': 1.5 });
          if (ours) text(g, X(c) + 8, Y(mu) + (ym === 'fam' ? -8 : 15), 'ℓ₀ ' + L0SW[i], 'reflab');
          const hit = svgEl('rect', { x: X(c) - 11, y: Y(mu) - 11, width: 22, height: 22, class: 'hit' }, g);
          hit.setAttribute('aria-label', `${m.name}, ℓ₀ ${L0SW[i]}: CE ${c}, ${ym === 'fam' ? 'family absorption' : 'member prediction'} ${mu}`);
          bindTip(hit, fig, () => `<b>${m.name}</b> <span class="sub">· ℓ₀ = ${L0SW[i]}</span><div class="row"><span>CE score</span><b>${c.toFixed(1)}%</b></div><div class="row"><span>${ym === 'fam' ? 'Family absorption' : 'Member prediction'}</span><b>${fmt(mu, 1)} ± ${fmt(sd, 1)}</b></div>`);
        });
      });
      // direct labels: baselines at their densest-reconstruction end, SASA at its first point
      if (W >= 520) {
        const ends = ['topk', 'btk', 'mat'].map(k => ({ k, x: X(SW.ce[k][3]), y: Y(SW[ym][k][3][0]) })).sort((a, b2) => a.y - b2.y);
        for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
        ends.forEach(e => text(svg, e.x + 9, e.y + 4, MODELS[e.k].name, 'mlabel'));
      }
      text(svg, X(SW.ce.sasa[0]), Y(SW[ym].sasa[0][0]) + (ym === 'fam' ? 22 : -14), 'SASA', 'mlabel ours', 'middle');
      const names = { fam: 'Concept-family absorption (%)', mp6: 'Member prediction, up to 6 columns (%)' };
      let h = `<table class="dt"><caption>12,288 decoder columns: CE score and ${names[ym]}</caption><thead><tr><th>Model</th>${L0SW.map(v => `<th>ℓ₀ = ${v}</th>`).join('')}</tr></thead><tbody>`;
      ORDER.forEach(k => { h += `<tr${k === 'sasa' ? ' class="ours"' : ''}><td>${MODELS[k].name}</td>${L0SW.map((_, i) => `<td>${SW.ce[k][i].toFixed(1)} / ${fmt(SW[ym][k][i][0], 1)} <span class="pm">± ${fmt(SW[ym][k][i][1], 1)}</span></td>`).join('')}</tr>`; });
      $('.tbl', fig).innerHTML = `<div class="scroll-x">${h}</tbody></table></div><p class="tnote">Each cell gives CE score / ${names[ym].toLowerCase()}.${ym === 'mp6' ? ' BatchTopK at ℓ₀ = 240 averages seven eligible families instead of ten.' : ''}</p>`;
    }
    $$('button[data-y]', fig).forEach(b => b.addEventListener('click', () => { ym = b.dataset.y; setTabs(fig, 'y', ym); render(); }));
    responsive(host, 320, (w, a) => { W = w; avail = a; render(); });
  }

  // member prediction with 6 or 24 decoder columns (the paper's Tables 8 and 9)
  function budget(fig) {
    fig.innerHTML = `
      <div class="fig-controls"><div class="tabs" role="tablist" aria-label="budget">
        <button type="button" class="tab on" data-b="mp6">Up to 6 columns</button><button type="button" class="tab" data-b="mp24">Up to 24 columns</button></div></div>
      ${legend(ORDER)}
      <div class="chart-host"><svg class="chart" role="img"></svg></div>`;
    const svg = $('svg.chart', fig), host = $('.chart-host', fig);
    let bm = 'mp6', W = 640, avail = 640;
    function render() {
      svg.setAttribute('aria-label', `Member prediction accuracy, ${bm === 'mp6' ? 'up to 6' : 'up to 24'} decoder columns, 12,288-column dictionaries`);
      lineChart(svg, fig, W, avail, {
        H: 280, xs: L0SW, xname: 'ℓ₀ =', xlabel: [{ t: 'target sparsity ' }, { m: 'ℓ' }, { s: '0' }],
        lo: 0, hi: 100, metric: 'Member prediction (%)', tfmt: t => t + '%', ylab: 'accuracy, higher is better',
        series: ORDER.map(k => ({ k, v: SW[bm][k] })),
      });
    }
    $$('button[data-b]', fig).forEach(b => b.addEventListener('click', () => { bm = b.dataset.b; setTabs(fig, 'b', bm); render(); }));
    responsive(host, 320, (w, a) => { W = w; avail = a; render(); });
  }

  // Mistral-7B against the published ReLU SAE (the paper's Table 5)
  function mistral(fig) {
    fig.innerHTML = `${legend(['relu', 'sasa'])}<div class="panels two-auto"></div>`;
    const host = $('.panels', fig);
    const D = { relu: { m: [66.1, 1.8], f: [17.0, 0.8] }, sasa: { m: [25.9, 1.6], f: [4.4, 0.3] } };
    let W = 640;
    function render() {
      host.innerHTML = '';
      const two = W >= 560, pw = two ? Math.floor((W - 24) / 2) : W;
      host.classList.toggle('two', two);
      [['m', 'Mean absorption (%)', 80], ['f', 'Full absorption (%)', 25]].forEach(([k, lab, hi]) => {
        const d = document.createElement('div'); d.className = 'panel'; host.appendChild(d);
        const svg = svgEl('svg', { class: 'chart', role: 'img', 'aria-label': `Mistral-7B ${lab}: ReLU SAE ${D.relu[k][0]}, SASA ${D.sasa[k][0]}` }, d);
        dotRows(svg, fig, pw, pw, [{ k: 'relu', v: D.relu[k] }, { k: 'sasa', v: D.sasa[k] }], { lo: 0, hi, axis: lab + ', lower is better', metric: lab, bars: true, labW: 84 });
      });
    }
    responsive(host, 300, w => { W = w; render(); });
  }

  // ── qualitative: per-token group norms ────────────────────────────────────────────────────
  const PROFILES = {
    gpt2: {
      title: 'GPT-2, Group 1473', note: 'Group norms read from the paper’s Figure 12a. GPT-2 tokens; the first token has norm about 0.',
      sents: [
        { t: ['On', ' Monday', ',', ' March', ' 3', ',', ' 1997', ',', ' the', ' committee', ' met', ' in', ' private', ' session', '.'], v: [0.02, 12.51, 4.02, 4.97, 3.35, 3.14, 3.37, 3.55, 1.75, 1.02, 1.44, 0.52, 1.56, 1.78, 0.95], c: { 1: 'Day', 3: 'Month', 4: 'Number', 6: 'Year' } },
        { t: ['On', ' Friday', ',', ' September', ' 21', ',', ' 2001', ',', ' the', ' city', ' was', ' marked', ' by', ' heavy', ' rain', '.'], v: [0.02, 12.11, 4.02, 5.22, 3.37, 2.89, 2.99, 3.39, 1.51, 1.48, 0.82, 1.12, 1.23, 1.91, 2.82, 2.4], c: { 1: 'Day', 3: 'Month', 4: 'Number', 6: 'Year' } },
        { t: ['In', ' the', ' summer', ' of', ' 2012', ',', ' the', ' team', ' traveled', ' to', ' Europe', ' for', ' training', '.'], v: [0.02, 0.7, 6.28, 3.33, 7.32, 3.53, 1.48, 1.25, 1.54, 1.12, 1.61, 1.64, 1.16, 1.25], c: { 2: 'Season', 4: 'Year' } },
      ],
    },
    mistral: {
      title: 'Mistral-7B, Group 1570', note: 'Group norms read from the paper’s Figure 13. Mistral tokens, starting with the beginning-of-sequence token; “skyline” is two tokens.',
      sents: [
        { t: ['<s>', 'A', ' storm', ' delayed', ' my', ' flight', ' to', ' Chicago', ' in', ' the', ' US', '.'], v: [5.38, 1.2, 3.27, 2.22, 2.9, 3.5, 4.18, 29.09, 3.55, 3.12, 18.94, 3.69], c: { 7: 'City', 10: 'Country' } },
        { t: ['<s>', 'The', ' Toronto', ' sky', 'line', ' in', ' Canada', ' is', ' impressive', '.'], v: [5.38, 1.62, 31.36, 3.12, 3.74, 3.72, 22.92, 6.57, 3.97, 4.12], c: { 2: 'City', 6: 'Country' } },
        { t: ['<s>', 'Our', ' team', ' met', ' in', ' Paris', ' in', ' France', ' before', ' heading', ' back', ' from', ' Europe', '.'], v: [5.38, 1.66, 3.51, 3.0, 2.59, 26.74, 3.74, 21.98, 3.65, 3.01, 4.82, 3.09, 15.39, 1.14], c: { 5: 'City', 7: 'Country', 12: 'Continent' } },
      ],
    },
  };
  function tokens(fig) {
    fig.innerHTML = `
      <div class="fig-controls"><div class="tabs" role="tablist" aria-label="model and group">
        <button type="button" class="tab on" data-p="gpt2">GPT-2 · temporal group</button><button type="button" class="tab" data-p="mistral">Mistral-7B · geography group</button></div>
        <span class="hint">hover a token for its group norm</span></div>
      <div class="tok-list"></div><p class="tok-note"></p>`;
    const list = $('.tok-list', fig);
    let p = 'gpt2';
    function render() {
      const P = PROFILES[p], max = Math.max(...P.sents.flatMap(s => s.v));
      list.innerHTML = P.sents.map((s, si) => `<div class="tok-row" role="list" aria-label="${esc(s.t.join('').replace('<s>', ''))}">${s.t.map((tk, i) => {
        const v = s.v[i], k = v / max, cat = s.c[i];
        const shown = tk === '<s>' ? '⟨s⟩' : tk.replace(/^ /, '');
        return `<span class="tok${cat ? ' has-cat' : ''}${tk === '<s>' ? ' bos' : ''}" role="listitem" data-s="${si}" data-i="${i}" style="--k:${k.toFixed(3)}"><span class="bar"><i style="height:${Math.max(1.5, k * 100).toFixed(1)}%"></i></span><span class="w${/^ /.test(tk) ? ' sp' : ''}">${esc(shown)}</span><span class="cat">${cat || ''}</span></span>`;
      }).join('')}</div>`).join('');
      $('.tok-note', fig).textContent = P.note;
      $$('.tok', list).forEach(el => {
        const s = P.sents[+el.dataset.s], i = +el.dataset.i, tk = s.t[i];
        el.setAttribute('aria-label', `${tk.trim()} ${s.v[i].toFixed(1)}${s.c[i] ? ', ' + s.c[i] : ''}`);
        bindTip(el, fig, () => `<b>${esc(tk === '<s>' ? 'beginning of sequence' : '“' + tk + '”')}</b>${s.c[i] ? ` <span class="sub">· ${s.c[i]}</span>` : ''}<div class="row"><span>group norm</span><b>${s.v[i].toFixed(1)}</b></div>`);
      });
    }
    $$('button[data-p]', fig).forEach(b => b.addEventListener('click', () => { p = b.dataset.p; setTabs(fig, 'p', p); render(); }));
    render();
  }

  // ── causal interventions on Mistral-7B (the paper's Tables 2, 13-15) ──────────────────────────────────
  const CAUSAL = {
    months: {
      add: { sel: [5.6, 8.3, 34.6, 78.7, 83.0], same: [5.6, 5.7, 6.1, 7.2, 15.3], diff: [5.6, 6.5, 8.3, 7.2, 7.2], rand: [5.6, 5.6, 5.6, 5.9, 6.5] },
      rem: [['Unsteered', 86.1], ['Selected group', 40.9], ['Control: same concept', 85.9], ['Control: different concept', 84.7], ['Random subspace', 86.1], ['Subtract random vector', 86.2]],
      addPrompt: ['The report is due in ', 'lamp', '. The report is due in'], remPrompt: ['The report is due in ', 'March', '. The report is due in'],
      what: 'month names',
    },
    weekdays: {
      add: { sel: [5.0, 9.3, 52.0, 80.1, 81.7], same: [5.0, 5.0, 5.8, 11.3, 15.5], diff: [5.0, 6.5, 12.0, 8.7, 8.2], rand: [5.0, 5.1, 5.4, 5.9, 8.0] },
      rem: [['Unsteered', 90.0], ['Selected group', 45.2], ['Control: same concept', 88.1], ['Control: different concept', 88.9], ['Random subspace', 90.0], ['Subtract random vector', 89.7]],
      addPrompt: ['The class meets on ', 'lamp', '. The class meets on'], remPrompt: ['The class meets on ', 'Monday', '. The class meets on'],
      what: 'weekday names',
    },
  };
  const SPEC = [['Month templates', [['Unsteered', 5.6, 0.1], ['Month vector', 78.7, 0.4], ['Weekday vector', 7.2, 43.4]]], ['Weekday templates', [['Unsteered', 0.6, 5.0], ['Month vector', 56.8, 8.7], ['Weekday vector', 0.5, 80.1]]]];
  function steering(fig) {
    fig.innerHTML = `
      <div class="fig-controls">
        <div class="tabs" role="tablist" aria-label="concept"><button type="button" class="tab on" data-c="months">Months</button><button type="button" class="tab" data-c="weekdays">Weekdays</button></div>
        <div class="tabs" role="tablist" aria-label="intervention"><button type="button" class="tab on" data-v="add">Add the group vector</button><button type="button" class="tab" data-v="rem">Remove the subspace</button><button type="button" class="tab" data-v="spec">Specificity</button></div>
      </div>
      <div class="ex-prompt"><div class="lab">Prompt format</div><div class="q"></div><div class="op"></div></div>
      <div class="legend steer-key"></div>
      <div class="chart-host"><svg class="chart" role="img"></svg></div>`;
    const svg = $('svg.chart', fig), host = $('.chart-host', fig);
    let c = 'months', v = 'add', W = 640, avail = 640;
    const SER = [['sel', 'Selected group', 'var(--sasa)', null, 'dot', 'Selected group'], ['same', 'Control: same concept', 'var(--fg2)', null, 'sq', 'Same concept'], ['diff', 'Control: different concept', 'var(--fg3)', '6 4', 'tri', 'Other concept'], ['rand', 'Random vector', 'var(--fg5)', '2 3', 'dia', 'Random']];
    function render() {
      const C = CAUSAL[c];
      const q = $('.ex-prompt .q', fig), op = $('.ex-prompt .op', fig), key = $('.steer-key', fig);
      $('.ex-prompt', fig).hidden = v === 'spec';
      if (v === 'add') {
        q.innerHTML = `${esc(C.addPrompt[0])}<mark>${esc(C.addPrompt[1])}</mark>${esc(C.addPrompt[2])} <span class="blank">___</span>`;
        op.innerHTML = `The name is replaced by an unrelated noun such as <i>lamp</i>. At that position, layer 8 adds α times the group’s mean decoded vector. The lines give the total probability of the ${c === 'months' ? '12 month' : '7 weekday'} names at the blank.`;
        key.innerHTML = SER.map(s => `<span><svg width="22" height="12" viewBox="0 0 22 12"><line x1="1" x2="21" y1="6" y2="6" stroke="${s[2]}" stroke-width="2" ${s[3] ? `stroke-dasharray="${s[3]}"` : ''}/></svg>${s[1]}</span>`).join('');
        key.hidden = false;
        svg.setAttribute('aria-label', `Probability of ${C.what} as the steering scale grows`);
        lineChart(svg, fig, W, avail, {
          H: 290, xs: [0, 0.5, 1, 2, 4], xname: 'α =', xlabel: [{ t: 'steering scale ' }, { m: 'α' }], lo: 0, hi: 100, metric: `P(${C.what}) (%)`, tfmt: t => t + '%', pad: 0.35, rightPad: 112,
          ylab: `probability of the ${C.what}`,
          series: SER.map(([k, name, color, dash, shape, short]) => ({ name, short, color, dash, shape, bold: k === 'sel', v: C.add[k] })),
        });
      } else if (v === 'rem') {
        q.innerHTML = `${esc(C.remPrompt[0])}<mark>${esc(C.remPrompt[1])}</mark>${esc(C.remPrompt[2])} <span class="blank">___</span>`;
        op.innerHTML = 'At the highlighted name, layer 8 projects the normalized hidden state off an 8-dimensional subspace: the selected group’s decoder span, a control group’s span, or a random one.';
        key.hidden = true;
        svg.setAttribute('aria-label', `Probability of ${C.what} after removing a subspace`);
        const rows = C.rem, H = 30 * rows.length + 54, labW = W < 460 ? 150 : 196, r = 60;
        sizeSvg(svg, W, H, avail); svg.innerHTML = '';
        const X = x => labW + x / 100 * (W - labW - r);
        [0, 25, 50, 75, 100].forEach(t => { svgEl('line', { x1: X(t), x2: X(t), y1: 6, y2: 6 + 30 * rows.length, class: t ? 'grid' : 'axis' }, svg); text(svg, X(t), 22 + 30 * rows.length, t + '%', 'tick', 'middle'); });
        text(svg, labW, 40 + 30 * rows.length, `probability of the ${C.what} at the blank`, 'alabel');
        rows.forEach(([name, val], i) => {
          const y = 6 + i * 30, sel = i === 1, base = i === 0, g = svgEl('g', { class: 'row' }, svg);
          svgEl('rect', { x: 0, y: y + 1, width: W, height: 28, class: 'hl', rx: 4 }, g);
          text(g, labW - 10, y + 19, name, 'mlabel' + (sel ? ' ours' : ''), 'end');
          svgEl('path', { d: hbar(X(0), y + 8, X(val) - X(0), 14), fill: sel ? 'var(--sasa)' : base ? 'var(--fg3)' : 'var(--cell-c)' }, g);
          text(g, X(val) + 7, y + 19, val.toFixed(1) + '%', 'vlabel' + (sel ? ' ours' : ''));
          const hit = svgEl('rect', { x: 0, y, width: W, height: 30, class: 'hit' }, g);
          hit.setAttribute('aria-label', `${name}: ${val}%`);
          bindTip(hit, fig, () => `<b>${esc(name)}</b><div class="row"><span>P(${C.what})</span><b>${val.toFixed(1)}%</b></div>`);
        });
      } else {
        key.hidden = true;
        svg.setAttribute('aria-label', 'Each steering vector raises its own concept on both prompt sets');
        const cw = Math.min(150, (W - 190) / 2), rowH = 30, H = 34 + rowH * 6 + 20 + 30, labW = Math.max(150, W - 2 * cw - 30);
        sizeSvg(svg, W, H, avail); svg.innerHTML = '';
        const x0 = labW + 10;
        text(svg, x0 + cw / 2, 18, 'P(month names)', 'ptitle', 'middle'); text(svg, x0 + cw * 1.5 + 8, 18, 'P(weekday names)', 'ptitle', 'middle');
        let y = 30;
        SPEC.forEach(([grp, rows], gi) => {
          text(svg, 4, y + 14, grp, 'alabel');
          y += 20;
          rows.forEach(([name, pm, pw]) => {
            text(svg, labW, y + 19, name, 'mlabel', 'end');
            [[pm, 0, 'months'], [pw, 1, 'weekdays']].forEach(([val, j, tgt]) => {
              const x = x0 + j * (cw + 8), hot = (name === 'Month vector' && tgt === 'months') || (name === 'Weekday vector' && tgt === 'weekdays');
              const g = svgEl('g', {}, svg);
              svgEl('rect', { x, y: y + 2, width: cw, height: rowH - 4, rx: 4, fill: 'var(--sasa)', 'fill-opacity': (0.06 + 0.9 * val / 100).toFixed(3) }, g);
              text(g, x + cw / 2, y + 19, val.toFixed(1) + '%', 'vlabel' + (hot ? ' ours' : ''), 'middle').setAttribute('fill', val > 55 ? '#fff' : 'var(--fg1)');
              const hit = svgEl('rect', { x, y: y + 2, width: cw, height: rowH - 4, class: 'hit' }, g);
              hit.setAttribute('aria-label', `${grp}, ${name}: P(${tgt}) ${val}%`);
              bindTip(hit, fig, () => `<b>${esc(grp)}</b> <span class="sub">· ${esc(name)}, α = 2</span><div class="row"><span>P(${tgt === 'months' ? 'month' : 'weekday'} names)</span><b>${val.toFixed(1)}%</b></div>`);
            });
            y += rowH;
          });
          y += 4;
        });
      }
    }
    $$('button[data-c]', fig).forEach(b => b.addEventListener('click', () => { c = b.dataset.c; setTabs(fig, 'c', c); render(); }));
    $$('button[data-v]', fig).forEach(b => b.addEventListener('click', () => { v = b.dataset.v; setTabs(fig, 'v', v); $$('button[data-c]', fig).forEach(x => { x.disabled = v === 'spec'; }); render(); }));
    responsive(host, 320, (w, a) => { W = w; avail = a; render(); });
  }

  // ── ablations on synthetic activations (the paper's Tables 10, 11) ────────────────────────────────────
  function synth(fig) {
    const DIM = [1, 4, 8, 12, 16];
    const S = {
      n: [['TopK, ℓ₀ = 64', 'topk', null, [2.0, 8.1, 17.9, 25.9, 31.8]], ['TopK, ℓ₀ = 32', 'topk', '6 4', [2.0, 8.0, 15.0, 22.7, 646.8]], ['SASA, r = 16 (ℓ₀ = 64)', 'sasa', null, [1.0, 1.0, 1.0, 1.0, 1.2]], ['SASA, r = 8 (ℓ₀ = 32)', 'sasa', '6 4', [1.0, 1.0, 1.0, 2.0, 2.1]]],
      ev: [['TopK, ℓ₀ = 64', 'topk', null, [99.5, 98.1, 96.6, 94.6, 92.6]], ['TopK, ℓ₀ = 32', 'topk', '6 4', [99.6, 98.5, 96.7, 94.3, 47.1]], ['SASA, r = 16 (ℓ₀ = 64)', 'sasa', null, [97.8, 98.9, 98.4, 97.8, 95.6]], ['SASA, r = 8 (ℓ₀ = 32)', 'sasa', '6 4', [91.6, 96.0, 97.6, 84.1, 83.0]]],
    };
    fig.innerHTML = `
      <div class="fig-controls"><div class="tabs" role="tablist" aria-label="measure"><button type="button" class="tab on" data-m="n">Atoms or groups per feature</button><button type="button" class="tab" data-m="ev">Explained variance in the feature subspace</button></div></div>
      <div class="legend synth-key"></div>
      <div class="chart-host"><svg class="chart" role="img"></svg></div>`;
    const svg = $('svg.chart', fig), host = $('.chart-host', fig);
    let m = 'n', W = 640, avail = 640;
    $('.synth-key', fig).innerHTML = S.n.map(([name, k, dash]) => `<span><svg width="22" height="12" viewBox="0 0 22 12"><line x1="1" x2="21" y1="6" y2="6" stroke="${MODELS[k].color}" stroke-width="2.2" ${dash ? `stroke-dasharray="${dash}"` : ''}/></svg>${name}</span>`).join('');
    function render() {
      const isN = m === 'n';
      svg.setAttribute('aria-label', isN ? 'Decoder atoms (TopK) or groups (SASA) needed per feature, by feature dimension, log scale' : 'Explained variance within each feature subspace, by feature dimension');
      lineChart(svg, fig, W, avail, {
        H: 300, xs: DIM, xname: 'dᵢ =', xlabel: [{ t: 'feature dimension ' }, { m: 'd' }, { s: 'i' }], log: isN, lo: isN ? 0.7 : 40, hi: isN ? 1000 : 100, rightPad: 140,
        ylab: isN ? 'atoms (TopK) or groups (SASA) per feature, log scale' : 'explained variance in the feature subspace',
        yticks: isN ? [1, 10, 100, 1000] : [40, 60, 80, 100], tfmt: isN ? String : t => t + '%', metric: isN ? 'units per feature' : 'explained variance (%)',
        series: S[m].map(([name, k, dash, v]) => ({ name, k: null, color: MODELS[k].color, shape: MODELS[k].shape, dash, bold: k === 'sasa', hollow: !!dash, dx: dash ? 4 : -4, v })),
      });
    }
    $$('button[data-m]', fig).forEach(b => b.addEventListener('click', () => { m = b.dataset.m; setTabs(fig, 'm', m); render(); }));
    responsive(host, 320, (w, a) => { W = w; avail = a; render(); });
  }
  function rank(fig) {
    fig.innerHTML = `<div class="legend"><span><svg width="22" height="12" viewBox="0 0 22 12"><line x1="1" x2="21" y1="6" y2="6" stroke="var(--fg4)" stroke-width="2" stroke-dasharray="6 4"/></svg>no penalty (EV 98.3%)</span><span><svg width="22" height="12" viewBox="0 0 22 12"><line x1="1" x2="21" y1="6" y2="6" stroke="var(--sasa)" stroke-width="2.4"/></svg>nuclear-norm penalty (EV 97.2%)</span><span><svg width="22" height="12" viewBox="0 0 22 12"><line x1="1" x2="21" y1="6" y2="6" stroke="var(--rule-strong)" stroke-width="1.6"/></svg>rank equal to the feature dimension</span></div>
      <div class="chart-host"><svg class="chart" role="img" aria-label="Effective rank of each group against the dimension of its feature, with and without the nuclear-norm penalty"></svg></div>`;
    const svg = $('svg.chart', fig), host = $('.chart-host', fig);
    const XS = [1, 2, 3, 4, 5, 6, 7, 8];
    responsive(host, 300, (W, avail) => {
      const g = lineChart(svg, fig, W, avail, {
        H: 270, xs: XS, xname: 'dᵢ =', xlabel: [{ t: 'feature dimension ' }, { m: 'd' }, { s: 'i' }], lo: 0, hi: 10, yticks: [0, 2, 4, 6, 8, 10], metric: 'effective rank', pad: 0.4, rightPad: 104, ylab: 'effective rank of the group',
        series: [{ name: 'no penalty', color: 'var(--fg4)', shape: 'sq', dash: '6 4', hollow: true, v: [7.1, 6.8, 6.1, 6.1, 6.4, 6.4, 7.2, 8.1] }, { name: 'with penalty', k: null, color: 'var(--sasa)', shape: 'dot', bold: true, v: [4.2, 4.7, 4.7, 5.5, 5.5, 6.5, 7.0, 7.9] }],
      });
      const ref = svgEl('path', { d: XS.map((x, i) => (i ? 'L' : 'M') + g.X(i) + ',' + g.Y(x)).join(''), stroke: 'var(--rule-strong)', 'stroke-width': 1.6, fill: 'none' }, svg);
      svg.insertBefore(ref, svg.querySelector('g'));
    });
  }

  // data acquisition time (the paper's Figure 2)
  function clock(fig) {
    fig.innerHTML = `<div class="chart-host"><svg class="chart" role="img" aria-label="Time per million tokens on Mistral-7B: 196.8 seconds for the language-model forward pass, 3.3 for the SASA forward pass, 4.6 for the SASA backward pass"></svg></div>`;
    const svg = $('svg.chart', fig), host = $('.chart-host', fig);
    const rows = [['Mistral-7B forward pass', 'LLM forward', 196.8, 'var(--fg2)'], ['SASA forward pass', 'SASA forward', 3.3, 'var(--sasa)'], ['SASA backward pass', 'SASA backward', 4.6, 'var(--sasa)']];
    responsive(host, 300, (W, avail) => {
      const narrow = W < 520, labW = narrow ? 108 : 176, H = 30 * rows.length + 50;
      sizeSvg(svg, W, H, avail); svg.innerHTML = '';
      const X = x => labW + x / 200 * (W - labW - 66);
      [0, 50, 100, 150, 200].forEach(t => { svgEl('line', { x1: X(t), x2: X(t), y1: 4, y2: 4 + 30 * rows.length, class: t ? 'grid' : 'axis' }, svg); text(svg, X(t), 20 + 30 * rows.length, String(t), 'tick', 'middle'); });
      text(svg, labW, 38 + 30 * rows.length, 'seconds per million tokens, mean of 20 runs', 'alabel');
      rows.forEach(([long, short, v, col], i) => {
        const y = 4 + 30 * i;
        text(svg, labW - 10, y + 19, narrow ? short : long, 'mlabel', 'end');
        svgEl('path', { d: hbar(X(0), y + 8, Math.max(2, X(v) - X(0)), 14), fill: col }, svg);
        text(svg, X(v) + 7, y + 19, v.toFixed(1) + ' s', 'vlabel');
      });
    });
  }

  const builders = { matched, sweep, tradeoff, budget, mistral, tokens, steering, synth, rank, clock };
  function init() {
    U.lazy($$('[data-chart]'), n => { try { builders[n.dataset.chart](n); } catch (e) { console.error('chart', n.dataset.chart, e); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
