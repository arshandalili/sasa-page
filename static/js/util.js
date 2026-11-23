/* Shared helpers for the SASA page figures and charts. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MINUS = '−';
  const fmt = (v, d) => (Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v).toFixed(d).replace('-', MINUS);
  const signed = (v, d) => (v > 0 ? '+' : '') + fmt(v, d);
  const commas = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // KaTeX into an element (falls back to plain text before KaTeX loads)
  function tex(el, s, display) {
    if (window.katex) window.katex.render(s, el, { throwOnError: false, displayMode: !!display, macros: window.SASA_MACROS || {} });
    else el.textContent = s;
    return el;
  }
  function svgEl(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, x, y, s, cls, anchor = 'start', extra = {}) {
    const t = svgEl('text', Object.assign({ x, y, class: cls, 'text-anchor': anchor }, extra), parent);
    t.textContent = s;
    return t;
  }
  // a math variable inside SVG text, set in KaTeX's math-italic face: parts = [{m:'h'}, {t:' = '}, {s:'k'} (subscript)]
  function mathText(parent, x, y, parts, cls, anchor = 'start') {
    const t = svgEl('text', { x, y, class: cls, 'text-anchor': anchor }, parent);
    parts.forEach(p => {
      if (p.s != null) { const s = svgEl('tspan', { class: 'msub', dy: 4 }, t); s.textContent = p.s; const back = svgEl('tspan', { dy: -4 }, t); back.textContent = ' '; return; }
      const s = svgEl('tspan', p.m ? { class: p.b ? 'mvar mbold' : 'mvar' } : {}, t); s.textContent = p.m || p.t;
    });
    return t;
  }
  function ticks(lo, hi, n = 4) {
    const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag, out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return { ticks: out, step };
  }

  // one tooltip per figure
  function tip(fig) {
    let t = $(':scope > .tip', fig);
    if (!t) { t = document.createElement('div'); t.className = 'tip'; t.setAttribute('role', 'status'); fig.appendChild(t); }
    return {
      show(html, target, at) {
        t.innerHTML = html;
        const f = fig.getBoundingClientRect();
        let x, y;
        if (at) { x = at[0] - f.left; y = at[1] - f.top; }
        else { const r = target.getBoundingClientRect(); x = r.left + r.width / 2 - f.left; y = r.top - f.top; }
        t.classList.add('on');
        const w = t.offsetWidth;
        x = clamp(x, w / 2 + 4, f.width - w / 2 - 4);
        t.style.left = x + 'px'; t.style.top = y + 'px';
      },
      hide() { t.classList.remove('on'); },
    };
  }
  function bindTip(node, fig, html) {
    const tp = tip(fig);
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '0');
    const show = () => tp.show(typeof html === 'function' ? html() : html, node);
    node.addEventListener('mouseenter', show); node.addEventListener('focus', show);
    node.addEventListener('mouseleave', () => tp.hide()); node.addEventListener('blur', () => tp.hide());
  }
  function setTabs(group, attr, value) {
    $$(`button[data-${attr}]`, group).forEach(b => { const on = b.dataset[attr] === String(value); b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  }
  function tween(ms, fn, done) {
    if (REDUCED) { fn(1); if (done) done(); return; }
    const t0 = performance.now();
    const step = now => { const k = clamp((now - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3); fn(e); if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  }
  // charts are drawn at the container's real width (1 SVG unit = 1 CSS pixel), so text keeps its size on phones
  function responsive(host, minW, fn) {
    let last = 0;
    new ResizeObserver(() => {
      const w = Math.floor(host.clientWidth);
      if (w > 0 && Math.abs(w - last) > 1) { last = w; fn(Math.max(minW, w), w); }
    }).observe(host);
  }
  function sizeSvg(svg, W, H, avail) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.minWidth = W > avail ? W + 'px' : '';
  }
  // a horizontal bar with a 4px rounded data end, square at the baseline
  function hbar(x0, y, w, h, dir = 1) {
    const r = Math.min(4, w / 2, h / 2);
    if (w < 0.6) return '';
    return dir > 0
      ? `M${x0},${y} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - r)} z`
      : `M${x0},${y} h${-(w - r)} a${r},${r} 0 0 0 ${-r},${r} v${h - 2 * r} a${r},${r} 0 0 0 ${r},${r} h${w - r} z`;
  }
  // a vertical bar rising from baseline yb to yt, rounded at the top
  function vbar(x, yt, w, yb) {
    const h = yb - yt, r = Math.min(4, w / 2, h);
    if (h < 0.6) return '';
    return `M${x},${yb} v${-(h - r)} a${r},${r} 0 0 1 ${r},${-r} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} z`;
  }
  // marker shapes give each model a second cue besides color
  function marker(parent, shape, x, y, r, attrs) {
    let e;
    if (shape === 'tri') e = svgEl('path', { d: `M${x},${y - r * 1.15} L${x + r * 1.05},${y + r * 0.7} L${x - r * 1.05},${y + r * 0.7} Z` }, parent);
    else if (shape === 'sq') e = svgEl('rect', { x: x - r * 0.85, y: y - r * 0.85, width: r * 1.7, height: r * 1.7, rx: 1 }, parent);
    else if (shape === 'dia') e = svgEl('path', { d: `M${x},${y - r * 1.2} L${x + r * 1.2},${y} L${x},${y + r * 1.2} L${x - r * 1.2},${y} Z` }, parent);
    else e = svgEl('circle', { cx: x, cy: y, r }, parent);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  // build a figure only when it nears the viewport; the first screen is built at once
  function lazy(nodes, build, margin = '700px 0px') {
    if (!('IntersectionObserver' in window)) { nodes.forEach(build); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { io.unobserve(e.target); build(e.target); }
    }), { rootMargin: margin });
    nodes.forEach(n => io.observe(n));
  }
  // models and their identity: color token, marker shape, display name
  const MODELS = {
    topk: { name: 'TopK', color: 'var(--topk)', shape: 'tri' },
    btk: { name: 'BatchTopK', color: 'var(--btk)', shape: 'sq' },
    mat: { name: 'Matryoshka', color: 'var(--mat)', shape: 'dia' },
    sasa: { name: 'SASA', color: 'var(--sasa)', shape: 'dot' },
    relu: { name: 'ReLU SAE', color: 'var(--relu)', shape: 'sq' },
  };
  function legend(keys, extra = '') {
    return `<div class="legend" aria-hidden="true">${keys.map(k => {
      const m = MODELS[k];
      return `<span><svg width="14" height="14" viewBox="-7 -7 14 14">${shapeSvg(m.shape, m.color)}</svg>${esc(m.name)}</span>`;
    }).join('')}${extra}</div>`;
  }
  function shapeSvg(shape, color) {
    const a = `fill="${color}"`;
    if (shape === 'tri') return `<path d="M0,-5.2 L4.8,3.2 L-4.8,3.2 Z" ${a}/>`;
    if (shape === 'sq') return `<rect x="-4" y="-4" width="8" height="8" rx="1" ${a}/>`;
    if (shape === 'dia') return `<path d="M0,-5.4 L5.4,0 L0,5.4 L-5.4,0 Z" ${a}/>`;
    return `<circle r="4.6" ${a}/>`;
  }

  window.SasaUtil = { $, $$, NS, REDUCED, clamp, esc, MINUS, fmt, signed, commas, tex, svgEl, text, mathText, ticks, tip, bindTip, setTabs, tween, responsive, sizeSvg, hbar, vbar, marker, lazy, MODELS, legend, shapeSvg };
})();
