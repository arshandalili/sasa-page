/* Method figures for the SASA page: the months ring, covering by lines, the l1 certificate,
 * the two objectives, and the architecture diagram. All of them run on toy slices (t = 1).
 */
(function () {
  'use strict';
  const U = window.SasaUtil, T = window.SasaToy;
  const { $, $$, svgEl, text, mathText, tex, fmt, clamp, REDUCED, responsive, sizeSvg, ticks, tip, bindTip, setTabs, esc } = U;
  const DEG = Math.PI / 180, TAU = 2 * Math.PI;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // HTML labels (KaTeX) laid over an SVG or canvas
  function overlay(host) {
    const lay = document.createElement('div'); lay.className = 'glabels'; host.appendChild(lay);
    const made = {};
    return {
      put(key, s, x, y, W, H, cls = '', anchor = 'c') {
        let e = made[key];
        if (!e) { e = document.createElement('span'); e.className = 'glabel ' + cls; tex(e, s); lay.appendChild(e); made[key] = e; e.dataset.s = s; }
        else if (e.dataset.s !== s) { tex(e, s); e.dataset.s = s; }
        e.style.left = (x / W * 100) + '%'; e.style.top = (y / H * 100) + '%';
        e.style.transform = anchor === 'c' ? 'translate(-50%, -50%)' : anchor === 'l' ? 'translate(0, -50%)' : anchor === 'r' ? 'translate(-100%, -50%)' : anchor;
        e.hidden = false;
        return e;
      },
      hide(key) { if (made[key]) made[key].hidden = true; },
    };
  }
  // a label made of plain words and KaTeX pieces: parts = ['words', ['tex'], ...]
  function mixed(el, parts) {
    el.innerHTML = '';
    parts.forEach(p => { const sp = document.createElement('span'); if (Array.isArray(p)) tex(sp, p[0]); else sp.textContent = p; el.appendChild(sp); });
    return el;
  }
  function arcPath(cx, cy, r, a0, a1) {     // angles in radians, measured from +x, counterclockwise on screen (y up)
    const p0 = [cx + r * Math.cos(a0), cy - r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
    const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
    return `M${p0[0].toFixed(2)},${p0[1].toFixed(2)} A${r},${r} 0 ${large} 0 ${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // Cover: one ring-shaped feature, read by 12 vector latents or by one SASA group
  // ═══════════════════════════════════════════════════════════════════════════════════════════
  function cover(fig) {
    fig.innerHTML = `
      <div class="ring-row">
        <div class="ring-panel"><div class="ring-head"><b>Vector SAE</b><span>12 latents, one active per input</span></div>
          <div class="ring-box"><svg class="ring-svg" viewBox="0 0 400 352" role="img" aria-label="Twelve latents tile the ring of months; each month activates a different latent"></svg></div>
          <div class="ring-read" data-o="sae" aria-live="off"></div></div>
        <div class="ring-panel sasa"><div class="ring-head"><b>SASA</b><span>one group of width 2</span></div>
          <div class="ring-box"><svg class="ring-svg" viewBox="0 0 400 352" role="img" aria-label="One SASA group covers the whole ring; its two-dimensional code turns with the month"></svg></div>
          <div class="ring-read" data-o="sasa" aria-live="off"></div></div>
      </div>
      <div class="slider ring-ctl"><button type="button" class="play" id="cover-play" aria-label="Pause">❚❚</button>
        <label for="cover-month" class="sr">Month</label><input type="range" id="cover-month" min="0" max="12" step="0.01" value="2.5"><span class="v">March</span></div>`;
    const [sae, sas] = $$('svg', fig), boxes = $$('.ring-box', fig);
    const L = [overlay(boxes[0]), overlay(boxes[1])];
    const W = 400, H = 352, cx = 200, cy = 132, R = 92, BW = 13;
    const ang = m => Math.PI / 2 - TAU * m / 12;           // January at the top, clockwise
    const P = (a, r = R) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    const B = Math.cos(28 * DEG);                            // toy encoder threshold: each latent's tuning curve spans ±28°
    const strip = { x0: 34, x1: 384, y0: 276, y1: 322 };
    const SX = m => strip.x0 + (m / 12) * (strip.x1 - strip.x0);
    const act = (m, j) => Math.max(0, Math.cos((m - j) * TAU / 12) - B) / (1 - B);
    const winner = m => ((Math.round(m) % 12) + 12) % 12;

    function frame(svg, side) {
      svg.innerHTML = '';
      const g = svgEl('g', {}, svg);
      if (side === 'sae') {
        for (let j = 0; j < 12; j++) {                         // 12 decoder directions
          const [x, y] = P(ang(j), R - BW / 2 - 2);
          svgEl('line', { x1: cx, y1: cy, x2: x, y2: y, class: 'spoke', 'data-j': j }, g);
        }
        for (let j = 0; j < 12; j++) svgEl('path', { d: arcPath(cx, cy, R, ang(j) - 14.2 * DEG, ang(j) + 14.2 * DEG), class: 'ring-arc', 'data-j': j }, g);
      } else {
        svgEl('circle', { cx, cy, r: R - BW / 2 - 1, class: 'span-disc' }, g);
        svgEl('circle', { cx, cy, r: R, class: 'ring-one' }, g);
        svgEl('line', { x1: cx, y1: cy, x2: cx + 46, y2: cy, class: 'basis' }, g);
        svgEl('line', { x1: cx, y1: cy, x2: cx, y2: cy - 46, class: 'basis' }, g);
        svgEl('path', { d: `M${cx + 46},${cy} l-7,-4 v8 z`, class: 'basis-head' }, g);
        svgEl('path', { d: `M${cx},${cy - 46} l-4,7 h8 z`, class: 'basis-head' }, g);
      }
      for (let j = 0; j < 12; j++) {                           // month labels
        const [x, y] = P(ang(j), R + 21);
        text(g, x, y + 4, MONTHS[j].slice(0, 3), 'mon', 'middle');
      }
      // tuning strip
      const s = svgEl('g', { class: 'strip' }, svg);
      svgEl('line', { x1: strip.x0, x2: strip.x1, y1: strip.y1, y2: strip.y1, class: 'axis' }, s);
      for (let j = 0; j < 12; j++) text(s, SX(j), strip.y1 + 15, MONTHS[j][0], 'tick', 'middle');
      text(s, strip.x0, strip.y0 - 12, side === 'sae' ? 'activation of each latent across the year' : 'group norm and code coordinates across the year', 'alabel');
      if (side === 'sae') {
        for (let j = 0; j < 12; j++) {
          let d = '';
          for (let k = 0; k <= 120; k++) {
            const m = k / 10;
            const v = winner(m) === j ? act(m, j) : 0;
            d += (k ? 'L' : 'M') + SX(m).toFixed(1) + ',' + (strip.y1 - v * (strip.y1 - strip.y0)).toFixed(1);
          }
          svgEl('path', { d, class: 'tune', 'data-j': j }, s);
        }
      } else {
        const ys = f => { let d = ''; for (let k = 0; k <= 120; k++) { const m = k / 10, v = f(m); d += (k ? 'L' : 'M') + SX(m).toFixed(1) + ',' + (strip.y1 - (0.5 + 0.5 * v) * (strip.y1 - strip.y0)).toFixed(1); } return d; };
        svgEl('path', { d: ys(m => Math.cos(ang(m))), class: 'code-c' }, s);
        svgEl('path', { d: ys(m => Math.sin(ang(m))), class: 'code-c dot' }, s);
        svgEl('line', { x1: strip.x0, x2: strip.x1, y1: strip.y0, y2: strip.y0, class: 'norm-line' }, s);
      }
      svgEl('line', { x1: 0, x2: 0, y1: strip.y0 - 4, y2: strip.y1, class: 'now' }, s);
      // the moving input and its reconstruction
      svgEl('line', { class: 'err' }, svg);
      svgEl('circle', { r: 3.4, class: 'recon' }, svg);
      if (side === 'sasa') svgEl('line', { class: 'code-arrow' }, svg), svgEl('path', { class: 'code-head' }, svg);
      svgEl('circle', { r: 6.5, class: 'input' }, svg);
    }
    frame(sae, 'sae'); frame(sas, 'sasa');
    L[1].put('n', '\\lVert\\boldsymbol{a}_k\\rVert', strip.x1, strip.y0 - 11, W, H, 'lab-sasa small', 'r');
    const out = $('.v', fig), sl = $('#cover-month', fig), play = $('#cover-play', fig);
    const rd1 = $('[data-o=sae]', fig), rd2 = $('[data-o=sasa]', fig);
    let m = 2.5, playing = !REDUCED, raf = 0, last = 0, visible = true;

    function draw() {
      const a = ang(m), [hx, hy] = P(a);
      const j = winner(m), da = (m - j) * TAU / 12;
      // vector SAE: the nearest direction wins; its best reconstruction is the projection on that line
      $$('.ring-arc', sae).forEach(e => e.classList.toggle('on', +e.dataset.j === j));
      $$('.spoke', sae).forEach(e => e.classList.toggle('on', +e.dataset.j === j));
      $$('.tune', sae).forEach(e => e.classList.toggle('on', +e.dataset.j === j));
      const pr = Math.cos(da), [rx, ry] = P(ang(j), R * pr);
      const e1 = $('.err', sae); e1.setAttribute('x1', hx); e1.setAttribute('y1', hy); e1.setAttribute('x2', rx); e1.setAttribute('y2', ry);
      const r1 = $('.recon', sae); r1.setAttribute('cx', rx); r1.setAttribute('cy', ry);
      const i1 = $('.input', sae); i1.setAttribute('cx', hx); i1.setAttribute('cy', hy);
      const nx = SX(((m % 12) + 12) % 12);
      $$('.now', fig).forEach(e => { e.setAttribute('x1', nx); e.setAttribute('x2', nx); });
      L[0].put('h', '\\boldsymbol{h}', cx + (R - 24) * Math.cos(a + 0.2), cy - (R - 24) * Math.sin(a + 0.2), W, H, 'lab-ink');
      rd1.innerHTML = `Latent <b>${j + 1}</b> of 12 is on <span class="sep">·</span> error <b>${Math.abs(Math.sin(da)).toFixed(2)}</b> <i>t</i>`;
      // SASA: one group spans the plane; the code is the position on the ring
      const i2 = $('.input', sas); i2.setAttribute('cx', hx); i2.setAttribute('cy', hy);
      const r2 = $('.recon', sas); r2.setAttribute('cx', hx); r2.setAttribute('cy', hy);
      const ca = $('.code-arrow', sas), k = 1 - 12 / R;
      ca.setAttribute('x1', cx); ca.setAttribute('y1', cy); ca.setAttribute('x2', cx + (hx - cx) * k); ca.setAttribute('y2', cy + (hy - cy) * k);
      const hd = 8, ux = Math.cos(a), uy = -Math.sin(a), tx = cx + (hx - cx) * (k + 0.02), ty = cy + (hy - cy) * (k + 0.02);
      $('.code-head', sas).setAttribute('d', `M${tx + ux * 3},${ty + uy * 3} L${tx - ux * hd - uy * 4},${ty - uy * hd + ux * 4} L${tx - ux * hd + uy * 4},${ty - uy * hd - ux * 4} Z`);
      L[1].put('h', '\\boldsymbol{h}', cx + (R - 24) * Math.cos(a + 0.24), cy - (R - 24) * Math.sin(a + 0.24), W, H, 'lab-ink');
      const zc = Math.cos(a), zs = Math.sin(a);
      rd2.innerHTML = `Group on, code <b>(${fmt(zc, 2)}, ${fmt(zs, 2)})</b> <i>t</i> <span class="sep">·</span> error <b>0</b>`;
      out.textContent = MONTHS[winner(m)];
      sl.value = (((m % 12) + 12) % 12).toFixed(2);
    }
    function loop(now) {
      if (!playing || !visible) { raf = 0; return; }
      if (last) m = (m + (now - last) / 1000 * (12 / 18)) % 12;
      last = now; draw(); raf = requestAnimationFrame(loop);
    }
    function setPlaying(p) {
      playing = p; play.textContent = p ? '❚❚' : '▶'; play.setAttribute('aria-label', p ? 'Pause' : 'Play');
      if (p && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }
    play.addEventListener('click', () => setPlaying(!playing));
    sl.addEventListener('input', () => { setPlaying(false); m = +sl.value; draw(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && playing && !raf) { last = 0; raf = requestAnimationFrame(loop); } }).observe(fig);
    draw();
    setPlaying(playing);
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // Theorem 1: covering a feature slice with lines (k = 1) versus a basis (k = d_i)
  // ═══════════════════════════════════════════════════════════════════════════════════════════
  function covering(fig) {
    fig.innerHTML = `
      <div class="fig-controls">
        <div class="tabs" role="tablist" aria-label="feature slice"><button type="button" class="tab on" data-shape="circle">Circle, $d_i = 2$</button><button type="button" class="tab" data-shape="sphere">Sphere, $d_i = 3$</button></div>
        <div class="tabs" role="tablist" aria-label="co-activation budget"><button type="button" class="tab on" data-k="1">$k = 1$: one latent per input</button><button type="button" class="tab" data-k="d">$k = d_i$: one SASA group</button></div>
      </div>
      <div class="cover-row">
        <div class="cv-view"><canvas aria-label="feature slice covered by decoder directions"></canvas></div>
        <div class="side">
          <div class="slider"><label for="cov-eps" class="lab"></label><input type="range" id="cov-eps" min="0" max="1" step="0.001" value="0.52"><span class="v"></span></div>
          <dl class="readout">
            <dt class="L-beta"></dt><dd data-o="beta"></dd>
            <dt>Directions needed</dt><dd data-o="n"></dd>
            <dt class="L-exp"></dt><dd data-o="exp"></dd>
            <dd class="wide" data-o="note"></dd>
          </dl>
          <div class="cv-chart"><svg class="chart" role="img" aria-label="directions needed versus t over epsilon, log-log"></svg></div>
        </div>
      </div>
      <p class="hint cv-hint">Drag the sphere to turn it. Each shaded patch is the part of the slice routed to one decoder direction.</p>`;
    U.$$('.tab', fig).forEach(b => { if (window.renderMathInElement) window.renderMathInElement(b, { delimiters: [{ left: '$', right: '$', display: false }] }); });
    tex($('.lab', fig), '\\varepsilon/t'); mixed($('.L-beta', fig), ['Angle ', ['\\beta = \\arcsin(\\varepsilon/t)']]); mixed($('.L-exp', fig), ['Growth as ', ['\\varepsilon \\to 0']]);
    const cv = $('canvas', fig), host = cv.parentElement, ctx = cv.getContext('2d'), sl = $('#cov-eps', fig), chartSvg = $('.cv-chart svg', fig);
    let shape = 'circle', kmode = '1', eps = 0.2, size = 300, dpr = 1, yaw = 0.6, pitch = 0.42;
    const S = T.fibSphere(7000);
    let assign = null, assignN = -1, dirs = [];
    const tones = () => [css('--cell-a'), css('--cell-b'), css('--cell-c'), css('--cell-d')];
    const epsOf = v => 0.06 * Math.pow(10, v);
    sl.value = (Math.log10(eps / 0.06)).toFixed(3);

    function resize() {
      size = Math.floor(host.clientWidth); dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = size * dpr; cv.height = size * dpr; cv.style.width = size + 'px'; cv.style.height = size + 'px';
      draw();
    }
    function rot(p) {                                   // yaw about z, then pitch about x; returns view coords (x right, y up, z toward viewer)
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x1 = cy * p[0] - sy * p[1], y1 = sy * p[0] + cy * p[1], z1 = p[2];
      return [x1, cp * z1 - sp * y1, sp * z1 + cp * y1];
    }
    function nearest(N) {
      if (assignN === N) return;
      dirs = T.fibHemi(N); assign = new Int32Array(S.length);
      for (let i = 0; i < S.length; i++) {
        const p = S[i]; let best = -1, bi = 0;
        for (let j = 0; j < N; j++) { const d = dirs[j], v = Math.abs(p[0] * d[0] + p[1] * d[1] + p[2] * d[2]); if (v > best) { best = v; bi = j; } }
        assign[i] = bi;
      }
      assignN = N;
    }
    function draw() {
      const c = ctx, W = size, R = W * 0.4, cx = W / 2, cy = W / 2, beta = Math.asin(eps), sasa = kmode === 'd';
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, W);
      const ink = css('--ink'), green = css('--sasa'), tn = tones();
      if (shape === 'circle') {
        const N = sasa ? 2 : T.circleN(beta), band = Math.max(9, W * 0.035);
        if (!sasa) {
          // the strip of points within ε of the first line: |distance| ≤ ε = t sin β
          c.save(); c.beginPath(); c.arc(cx, cy, R + band, 0, TAU); c.clip();
          c.fillStyle = css('--tube'); c.fillRect(0, cy - eps * R, W, 2 * eps * R);
          c.restore();
          for (let j = 0; j < N; j++) {
            const a = j * Math.PI / N;
            c.strokeStyle = j === 0 ? ink : css('--fg5'); c.lineWidth = j === 0 ? 1.4 : 0.8;
            c.beginPath(); c.moveTo(cx - (R + band) * Math.cos(a), cy + (R + band) * Math.sin(a)); c.lineTo(cx + (R + band) * Math.cos(a), cy - (R + band) * Math.sin(a)); c.stroke();
          }
          // each point of the ring is routed to its nearest line; cells alternate tones, with surface gaps between them
          const half = Math.PI / (2 * N);
          for (let j = 0; j < N; j++) for (const flip of [0, Math.PI]) {
            const a = j * Math.PI / N + flip;
            c.strokeStyle = j === 0 ? css('--cell-on') : tn[j % 2]; c.lineWidth = band;
            const gap = Math.min(half * 0.3, 1.2 / R);
            c.beginPath(); c.arc(cx, cy, R, -(a + half - gap), -(a - half + gap)); c.stroke();
          }
        } else {
          c.fillStyle = css('--sasa-wash'); c.beginPath(); c.arc(cx, cy, R - band / 2, 0, TAU); c.fill();
          c.strokeStyle = green; c.lineWidth = band; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
          arrow(c, cx, cy, cx + R * 0.62, cy, green); arrow(c, cx, cy, cx, cy - R * 0.62, green);
        }
        c.fillStyle = ink; c.beginPath(); c.arc(cx, cy, 2.2, 0, TAU); c.fill();
      } else {
        // sphere: shading, cells by nearest line, and the line directions
        const N = sasa ? 3 : T.sphereN(beta);
        const grd = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
        grd.addColorStop(0, css('--globe-a')); grd.addColorStop(1, css('--globe-b'));
        c.fillStyle = grd; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
        if (!sasa) nearest(N);
        const pr = Math.max(1.3, R / 52);
        for (let i = 0; i < S.length; i++) {
          const v = rot(S[i]); if (v[2] < 0) continue;
          const shade = 0.55 + 0.45 * v[2];
          c.globalAlpha = shade;
          c.fillStyle = sasa ? green : (assign[i] === 0 ? css('--cell-on') : tn[assign[i] % 4]);
          c.beginPath(); c.arc(cx + v[0] * R, cy - v[1] * R, pr, 0, TAU); c.fill();
        }
        c.globalAlpha = 1;
        if (sasa) {
          [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(e => { const v = rot(e); arrow(c, cx, cy, cx + v[0] * R * 0.7, cy - v[1] * R * 0.7, css('--sasa-ink')); });
        } else {
          c.fillStyle = ink;
          const dr = Math.max(1.1, Math.min(2.4, 22 / Math.sqrt(N)));
          dirs.forEach(d => [1, -1].forEach(sg => { const v = rot([d[0] * sg, d[1] * sg, d[2] * sg]); if (v[2] > 0) { c.beginPath(); c.arc(cx + v[0] * R, cy - v[1] * R, dr, 0, TAU); c.fill(); } }));
        }
        c.strokeStyle = css('--globe-rim'); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
      }
    }
    function arrow(c, x0, y0, x1, y1, color) {
      const a = Math.atan2(y1 - y0, x1 - x0), h = 9;
      c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - h * 0.6 * Math.cos(a), y1 - h * 0.6 * Math.sin(a)); c.stroke();
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - h * Math.cos(a) + 4.2 * Math.sin(a), y1 - h * Math.sin(a) - 4.2 * Math.cos(a));
      c.lineTo(x1 - h * Math.cos(a) - 4.2 * Math.sin(a), y1 - h * Math.sin(a) + 4.2 * Math.cos(a)); c.closePath(); c.fill();
    }
    // log-log chart of directions needed against t/ε
    let CW = 300, Cav = 300;
    function chart() {
      const W = CW, H = 196, l = 44, r = 14, top = 12, b = 34;
      sizeSvg(chartSvg, W, H, Cav); chartSvg.innerHTML = '';
      const xl = Math.log10(1 / 0.6), xh = Math.log10(1 / 0.06), yl = 0, yh = Math.log10(2000);
      const X = v => l + (Math.log10(v) - xl) / (xh - xl) * (W - l - r), Y = v => top + (1 - (Math.log10(v) - yl) / (yh - yl)) * (H - top - b);
      [1, 10, 100, 1000].forEach(t => { svgEl('line', { x1: l, x2: W - r, y1: Y(t), y2: Y(t), class: 'grid' }, chartSvg); text(chartSvg, l - 6, Y(t) + 4, String(t), 'tick', 'end'); });
      [2, 5, 10].forEach(t => { svgEl('line', { x1: X(t), x2: X(t), y1: top, y2: H - b, class: 'grid' }, chartSvg); text(chartSvg, X(t), H - b + 15, String(t), 'tick', 'middle'); });
      mathText(chartSvg, (l + W - r) / 2, H - 4, [{ m: 't' }, { t: ' / ' }, { m: 'ε' }], 'alabel', 'middle');
      const series = [['circle', v => T.circleN(Math.asin(1 / v)), 'var(--fg3)'], ['sphere', v => T.sphereN(Math.asin(1 / v)), 'var(--ink)']];
      series.forEach(([name, f, col]) => {
        let d = '';
        for (let k = 0; k <= 200; k++) { const v = Math.pow(10, xl + (xh - xl) * k / 200); d += (k ? 'L' : 'M') + X(v).toFixed(1) + ',' + Y(f(v)).toFixed(1); }
        svgEl('path', { d, fill: 'none', stroke: col, 'stroke-width': name === shape && kmode === '1' ? 2.4 : 1.4, opacity: name === shape || kmode === 'd' ? 1 : 0.55 }, chartSvg);
      });
      [[2, 'circle'], [3, 'sphere']].forEach(([n, nm]) => svgEl('line', { x1: l, x2: W - r, y1: Y(n), y2: Y(n), stroke: 'var(--sasa)', 'stroke-width': nm === shape && kmode === 'd' ? 2.4 : 1.4, 'stroke-dasharray': '5 4' }, chartSvg));
      mathText(chartSvg, W - r - 2, Y(3) - 6, [{ t: 'one group: ' }, { m: 'N' }, { t: ' = ' }, { m: 'd' }, { s: 'i' }], 'reflab', 'end');
      const vEnd = 1 / 0.062;
      text(chartSvg, X(vEnd) - 2, Y(T.sphereN(Math.asin(0.062))) + 14, 'sphere', 'reflab', 'end');
      text(chartSvg, X(vEnd) - 2, Y(T.circleN(Math.asin(0.062))) - 7, 'circle', 'reflab', 'end');
      const v = 1 / eps;
      svgEl('line', { x1: X(v), x2: X(v), y1: top, y2: H - b, class: 'refline' }, chartSvg);
      const nNow = kmode === 'd' ? (shape === 'circle' ? 2 : 3) : (shape === 'circle' ? T.circleN(Math.asin(eps)) : T.sphereN(Math.asin(eps)));
      svgEl('circle', { cx: X(v), cy: Y(nNow), r: 5, fill: kmode === 'd' ? 'var(--sasa)' : 'var(--ink)', stroke: 'var(--bg)', 'stroke-width': 2 }, chartSvg);
    }
    function update() {
      const beta = Math.asin(eps), sasa = kmode === 'd', di = shape === 'circle' ? 2 : 3;
      $('.slider .v', fig).textContent = eps.toFixed(2);
      $('[data-o=beta]', fig).textContent = (beta / DEG).toFixed(1) + '°';
      const N = sasa ? di : shape === 'circle' ? T.circleN(beta) : T.sphereN(beta);
      $('[data-o=n]', fig).textContent = sasa ? `${N} (a basis, error 0)` : shape === 'circle' ? `${N} lines (exact minimum)` : `${N} lines (a lattice covering)`;
      tex($('[data-o=exp]', fig), sasa ? '\\text{none: } N = d_i' : shape === 'circle' ? '(t/\\varepsilon)^{1}' : '(t/\\varepsilon)^{2}');
      $('[data-o=note]', fig).innerHTML = sasa
        ? `With $k = d_i$ the ${di} basis directions reconstruct every point exactly, at every tolerance.`
        : shape === 'circle' ? 'Each line covers two opposite arcs of half-width β, so ⌈π / 2β⌉ lines are needed. The shaded strip is the set of points within ε of one line.'
          : 'Each line covers two opposite caps of radius β. The count is from a Fibonacci-lattice covering; Theorem 1 says any covering needs order (t/ε)² lines.';
      if (window.renderMathInElement) window.renderMathInElement($('[data-o=note]', fig), { delimiters: [{ left: '$', right: '$', display: false }] });
      $('.cv-hint', fig).hidden = shape !== 'sphere';
      cv.style.cursor = shape === 'sphere' ? 'grab' : 'default';
      draw(); chart();
    }
    let pend = false;
    sl.addEventListener('input', () => { eps = epsOf(+sl.value); if (!pend) { pend = true; requestAnimationFrame(() => { pend = false; update(); }); } });
    $$('button[data-shape]', fig).forEach(b => b.addEventListener('click', () => { shape = b.dataset.shape; setTabs(fig, 'shape', shape); update(); }));
    $$('button[data-k]', fig).forEach(b => b.addEventListener('click', () => { kmode = b.dataset.k; setTabs(fig, 'k', kmode); update(); }));
    // drag to rotate the sphere
    let drag = null;
    cv.addEventListener('pointerdown', e => { if (shape !== 'sphere') return; drag = [e.clientX, e.clientY, yaw, pitch]; cv.setPointerCapture(e.pointerId); cv.classList.add('dragging'); });
    cv.addEventListener('pointermove', e => { if (!drag) return; yaw = drag[2] + (e.clientX - drag[0]) * 0.01; pitch = clamp(drag[3] + (e.clientY - drag[1]) * 0.01, -1.5, 1.5); draw(); });
    const end = () => { drag = null; cv.classList.remove('dragging'); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    responsive(host, 200, () => resize());
    responsive($('.cv-chart', fig), 240, (w, a) => { CW = w; Cav = a; chart(); });
    update();
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // Theorem 2 / Proposition 2: the inactivity certificate of an added direction
  // ═══════════════════════════════════════════════════════════════════════════════════════════
  function certificate(fig) {
    fig.innerHTML = `
      <div class="cert-row">
        <div class="cert-view"><svg class="chart cert-svg" viewBox="0 0 340 340" role="img" aria-label="basis code, residual, and an added decoder direction on a two-dimensional feature slice"></svg></div>
        <div class="side">
          <div class="ctrl-grid">
            <div class="slider"><label for="cert-theta" class="lab">input angle</label><input type="range" id="cert-theta" min="0" max="360" step="0.5" value="24"><span class="v" data-o="th"></span></div>
            <div class="slider"><label for="cert-phi" class="lab L-phi"></label><input type="range" id="cert-phi" min="0" max="180" step="0.5" value="58"><span class="v" data-o="ph"></span></div>
            <div class="slider"><label for="cert-lam" class="lab L-lam"></label><input type="range" id="cert-lam" min="0.04" max="0.68" step="0.005" value="0.3"><span class="v" data-o="lam"></span></div>
          </div>
          <dl class="readout">
            <dt class="L-code"></dt><dd data-o="code"></dd>
            <dt class="L-r"></dt><dd data-o="r"></dd>
            <dt class="L-cert"></dt><dd data-o="cert"></dd>
            <dt>Loss here</dt><dd data-o="loss"></dd>
            <dt class="L-gap"></dt><dd data-o="gap"></dd>
            <dt>Prop. 2 bound</dt><dd data-o="bound"></dd>
            <dd class="wide" data-o="note"></dd>
          </dl>
        </div>
      </div>`;
    mixed($('.L-phi', fig), [['\\tilde{\\boldsymbol{d}}'], ' angle']); tex($('.L-lam', fig), '\\lambda / t');
    mixed($('.L-code', fig), ['Basis code ', ['\\boldsymbol{a}^\\star']]); mixed($('.L-r', fig), ['Residual ', ['\\lVert \\boldsymbol{r} \\rVert']]);
    mixed($('.L-cert', fig), [['\\tilde{\\boldsymbol{d}}^{\\top}\\boldsymbol{r}'], ' vs. ', ['\\lambda']]); mixed($('.L-gap', fig), ['Risk gap']);
    const svg = $('svg', fig), box = $('.cert-view', fig), lab = overlay(box);
    const W = 340, H = 340, cx = 170, cy = 170, R = 118;
    const sTh = $('#cert-theta', fig), sPh = $('#cert-phi', fig), sLam = $('#cert-lam', fig);
    let th = 24 * DEG, ph = 58 * DEG, lam = 0.3, gapCache = null;
    const P = (x, y) => [cx + x * R, cy - y * R];
    svg.innerHTML = `<g class="g-static"></g><g class="g-help"></g><g class="g-dyn"></g>`;
    const gs = $('.g-static', svg), gh = $('.g-help', svg), gd = $('.g-dyn', svg);
    // static: axes and circle
    svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--rule-strong)', 'stroke-width': 1.2 }, gs);
    [[1, 0], [0, 1]].forEach(([x, y]) => {
      const [x1, y1] = P(x * 1.22, y * 1.22), [x0, y0] = P(-x * 1.22, -y * 1.22);
      svgEl('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: 'var(--rule-strong)', 'stroke-width': 1 }, gs);
    });
    function helpArcs() {                                   // inputs where adding d̃ lowers the loss, from exact codes on a grid
      const D2 = [[1, 0], [0, 1]], D3 = [[1, 0], [0, 1], [Math.cos(ph), Math.sin(ph)]];
      const n = 720, on = new Uint8Array(n);
      let sB = 0, sD = 0, inU = 0;
      const c = [Math.cos(ph), Math.sin(ph)], c1 = Math.abs(c[0]) + Math.abs(c[1]);
      let a3 = null;
      for (let i = 0; i < n; i++) {
        const t = TAU * (i + 0.5) / n, h = [Math.cos(t), Math.sin(t)];
        const ab = T.basisCode(h, lam), rx = h[0] - ab[0], ry = h[1] - ab[1];
        const lb = 0.5 * (rx * rx + ry * ry) + lam * (Math.abs(ab[0]) + Math.abs(ab[1]));
        const o = T.lasso(h, D3, lam, a3); a3 = o.a;
        sB += lb; sD += o.loss; if (lb - o.loss > 1e-9) on[i] = 1;
        const inA = Math.abs(h[0]) > lam && Math.abs(h[1]) > lam;
        const sgn = (k) => Math.abs(c[k]) < 1e-9 || Math.sign(h[k]) === Math.sign(c[k]);
        if (inA && sgn(0) && sgn(1)) inU++;
      }
      gapCache = { gap: (sB - sD) / n, bound: lam * lam / 2 * Math.pow(c1 - 1, 2) * (inU / n), c1 };
      gh.innerHTML = '';
      // the set A (every basis coefficient clears the threshold): a light band
      for (let q = 0; q < 4; q++) {
        const a0 = q * Math.PI / 2 + Math.asin(Math.min(1, lam)), a1 = (q + 1) * Math.PI / 2 - Math.asin(Math.min(1, lam));
        if (a1 > a0) svgEl('path', { d: arcPath(cx, cy, R, a0, a1), class: 'setA' }, gh);
      }
      let i = 0;
      while (i < n) {
        if (!on[i]) { i++; continue; }
        let j = i; while (j + 1 < n && on[j + 1]) j++;
        svgEl('path', { d: arcPath(cx, cy, R + 9, TAU * i / n, TAU * (j + 1) / n), class: 'help-arc' }, gh);
        i = j + 1;
      }
    }
    function draw() {
      const h = [Math.cos(th), Math.sin(th)], ab = T.basisCode(h, lam), r = [h[0] - ab[0], h[1] - ab[1]];
      const dt = [Math.cos(ph), Math.sin(ph)], dr = dt[0] * r[0] + dt[1] * r[1];
      const o = T.lasso(h, [[1, 0], [0, 1], dt], lam);
      const lb = 0.5 * (r[0] * r[0] + r[1] * r[1]) + lam * (Math.abs(ab[0]) + Math.abs(ab[1]));
      gd.innerHTML = '';
      // added direction d̃ (a line through the origin) and the basis
      const [a0x, a0y] = P(-1.22 * dt[0], -1.22 * dt[1]), [a1x, a1y] = P(1.22 * dt[0], 1.22 * dt[1]);
      svgEl('line', { x1: a0x, y1: a0y, x2: a1x, y2: a1y, class: 'dline' }, gd);
      const arrowTo = (x, y, cls) => {
        const [ex, ey] = P(x, y), a = Math.atan2(ey - cy, ex - cx), hh = 9;
        svgEl('line', { x1: cx, y1: cy, x2: ex - Math.cos(a) * hh * 0.6, y2: ey - Math.sin(a) * hh * 0.6, class: cls }, gd);
        svgEl('path', { d: `M${ex},${ey} L${ex - hh * Math.cos(a) + 4 * Math.sin(a)},${ey - hh * Math.sin(a) - 4 * Math.cos(a)} L${ex - hh * Math.cos(a) - 4 * Math.sin(a)},${ey - hh * Math.sin(a) + 4 * Math.cos(a)} Z`, class: cls + '-head' }, gd);
      };
      arrowTo(0.55, 0, 'vec'); arrowTo(0, 0.55, 'vec'); arrowTo(dt[0] * 0.55, dt[1] * 0.55, 'dvec');
      // basis reconstruction, residual, input
      const [bx, by] = P(ab[0], ab[1]), [hx, hy] = P(h[0], h[1]);
      svgEl('line', { x1: cx, y1: cy, x2: bx, y2: by, class: 'codeline' }, gd);
      const rl = Math.hypot(hx - bx, hy - by);
      if (rl > 2) {
        const a = Math.atan2(hy - by, hx - bx), hh = Math.min(8, rl * 0.5);
        svgEl('line', { x1: bx, y1: by, x2: hx - Math.cos(a) * (hh + 5), y2: hy - Math.sin(a) * (hh + 5), class: 'resid' }, gd);
        const tx = hx - Math.cos(a) * 6.5, ty = hy - Math.sin(a) * 6.5;
        svgEl('path', { d: `M${tx},${ty} L${tx - hh * Math.cos(a) + 3.6 * Math.sin(a)},${ty - hh * Math.sin(a) - 3.6 * Math.cos(a)} L${tx - hh * Math.cos(a) - 3.6 * Math.sin(a)},${ty - hh * Math.sin(a) + 3.6 * Math.cos(a)} Z`, class: 'resid-head' }, gd);
      }
      svgEl('circle', { cx: bx, cy: by, r: 4, class: 'recon-dot' }, gd);
      const hd = svgEl('circle', { cx: hx, cy: hy, r: 7, class: 'h-dot' }, gd);
      hd.setAttribute('aria-hidden', 'true');
      const [dhx, dhy] = P(dt[0] * 1.22, dt[1] * 1.22);
      svgEl('circle', { cx: dhx, cy: dhy, r: 6.5, class: 'd-handle' }, gd);
      // labels
      lab.put('v1', '\\boldsymbol{v}_1', ...P(0.62, -0.09), W, H, 'lab-ink');
      lab.put('v2', '\\boldsymbol{v}_2', ...P(-0.1, 0.63), W, H, 'lab-ink');
      lab.put('d', '\\tilde{\\boldsymbol{d}}', ...P(dt[0] * 1.22 + 0.1 * Math.cos(ph + 1.2), dt[1] * 1.22 + 0.1 * Math.sin(ph + 1.2)), W, H, 'lab-ink');
      lab.put('h', '\\boldsymbol{h}', ...P(h[0] * 1.17, h[1] * 1.17), W, H, 'lab-ink');
      if (rl > 14) { const mx = (bx + hx) / 2, my = (by + hy) / 2, nx = -(hy - by) / rl, ny = (hx - bx) / rl; lab.put('r', '\\boldsymbol{r}', mx + nx * 12, my + ny * 12, W, H, 'lab-resid'); } else lab.hide('r');
      // readouts
      $('[data-o=th]', fig).textContent = (th / DEG).toFixed(0) + '°';
      $('[data-o=ph]', fig).textContent = (ph / DEG).toFixed(0) + '°';
      $('[data-o=lam]', fig).textContent = lam.toFixed(2);
      $('[data-o=code]', fig).textContent = `(${fmt(ab[0], 2)}, ${fmt(ab[1], 2)})`;
      $('[data-o=r]', fig).textContent = Math.hypot(r[0], r[1]).toFixed(3);
      const viol = Math.abs(dr) > lam + 1e-9;
      $('[data-o=cert]', fig).innerHTML = `${fmt(Math.abs(dr), 3)} ${viol ? '&gt;' : '≤'} ${lam.toFixed(3)} <span class="${viol ? 'pill-on' : 'pill-off'}">${viol ? 'fails' : 'holds'}</span>`;
      $('[data-o=loss]', fig).textContent = `${lb.toFixed(4)} → ${o.loss.toFixed(4)}`;
      $('[data-o=gap]', fig).textContent = gapCache ? gapCache.gap.toFixed(5) : '';
      $('[data-o=bound]', fig).textContent = gapCache ? gapCache.bound.toFixed(5) : '';
      const isBasis = Math.min(Math.abs(Math.sin(ph)), Math.abs(Math.cos(ph))) < 1e-6;
      $('[data-o=note]', fig).textContent = isBasis
        ? 'The added direction is a basis vector, so it never helps; the theorem excludes this case.'
        : viol ? 'Here the residual leans along d̃ by more than λ, so a small coefficient on d̃ lowers the loss. Green arcs mark every input where adding d̃ helps.'
          : 'Here the certificate holds and d̃ stays unused. Green arcs mark the inputs where adding d̃ does lower the loss.';
    }
    let pend = false;
    const refresh = (arcs) => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; if (arcs) helpArcs(); draw(); }); };
    sTh.addEventListener('input', () => { th = +sTh.value * DEG; refresh(false); });
    sPh.addEventListener('input', () => { ph = +sPh.value * DEG; refresh(true); });
    sLam.addEventListener('input', () => { lam = +sLam.value; refresh(true); });
    // drag the input or the added direction
    let mode = null;
    const angAt = e => { const b = svg.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * W - cx, y = cy - (e.clientY - b.top) / b.height * H; return [Math.atan2(y, x), Math.hypot(x, y)]; };
    svg.addEventListener('pointerdown', e => {
      const [a, rr] = angAt(e);
      const dh = Math.hypot(Math.cos(a) * rr - Math.cos(ph) * 1.22 * R, Math.sin(a) * rr - Math.sin(ph) * 1.22 * R), dh2 = Math.hypot(Math.cos(a) * rr + Math.cos(ph) * 1.22 * R, Math.sin(a) * rr + Math.sin(ph) * 1.22 * R);
      mode = Math.min(dh, dh2) < 22 ? 'd' : 'h';
      svg.setPointerCapture(e.pointerId); move(e);
    });
    const move = e => {
      if (!mode) return;
      let [a] = angAt(e);
      if (mode === 'h') { th = (a + TAU) % TAU; sTh.value = (th / DEG).toFixed(1); refresh(false); }
      else { a = ((a % Math.PI) + Math.PI) % Math.PI; ph = a; sPh.value = (ph / DEG).toFixed(1); refresh(true); }
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', () => { mode = null; }); svg.addEventListener('pointercancel', () => { mode = null; });
    helpArcs(); draw();
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // Proposition 2 versus Theorem 3: the two objectives prefer opposite things
  // ═══════════════════════════════════════════════════════════════════════════════════════════
  function prefs(fig) {
    fig.innerHTML = `
      <div class="pref-row">
        <div class="pref-col"><div class="plot-head"><b>Standard SAE:</b> population risk with ℓ<sub>1</sub> penalty and optimal codes</div>
          <div class="pref-chart"><svg class="chart" role="img" aria-label="l1 population risk falls as directions are added"></svg></div>
          <div class="slider"><label for="pref-lam" class="lab L-lam"></label><input type="range" id="pref-lam" min="0.05" max="0.68" step="0.005" value="0.3"><span class="v"></span></div></div>
        <div class="pref-col"><div class="plot-head"><b>SASA:</b> lowest objective with nuclear-norm penalty and Top-1 routing</div>
          <div class="pref-chart"><svg class="chart" role="img" aria-label="SASA objective rises as the slice is split across blocks"></svg></div>
          <div class="slider"><label for="pref-mu" class="lab L-mu"></label><input type="range" id="pref-mu" min="0.02" max="0.48" step="0.005" value="0.2"><span class="v"></span></div></div>
      </div>`;
    tex($('.L-lam', fig), '\\lambda / t'); tex($('.L-mu', fig), '\\lambda_{\\dim} / t^2');
    const [i1, i2] = $$('input', fig), [v1, v2] = $$('.slider .v', fig);
    const NS1 = Array.from({ length: 15 }, (_, i) => i + 2), NS2 = [1, 2, 3, 4, 5, 6, 7, 8];
    // one panel: a line of objective values, a point per setting, and a glyph that shows what the hovered setting means
    function panel(svg, xs, opts) {
      const st = { W: 300, avail: 300, ys: [], hov: opts.hov, dots: [], glyph: null, gl: null };
      st.render = () => {
        const W = st.W, H = 232, l = 112, r = 12, top = 14, b = 40, ys = st.ys;
        sizeSvg(svg, W, H, st.avail); svg.innerHTML = '';
        let lo = Math.min(...ys), hi = Math.max(...ys); const pad = (hi - lo) * 0.12 + 1e-4; lo -= pad; hi += pad;
        const X = v => l + 6 + (v - xs[0]) / (xs[xs.length - 1] - xs[0]) * (W - l - r - 6), Y = v => top + (1 - (v - lo) / (hi - lo)) * (H - top - b);
        const tk = ticks(lo, hi, 4);
        tk.ticks.forEach(t => { if (Y(t) < top - 1 || Y(t) > H - b + 1) return; svgEl('line', { x1: l + 6, x2: W - r, y1: Y(t), y2: Y(t), class: 'grid' }, svg); text(svg, l, Y(t) + 4, t.toFixed(tk.step < 0.01 ? 3 : 2), 'tick', 'end'); });
        xs.forEach((x, k) => { if (opts.xt(x)) text(svg, X(x), H - b + 16, String(x), 'tick', 'middle'); });
        text(svg, (l + 6 + W - r) / 2, H - 6, opts.xlabel, 'alabel', 'middle');
        let d = ''; xs.forEach((x, k) => { d += (k ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(ys[k]).toFixed(1); });
        svgEl('path', { d, fill: 'none', stroke: opts.color, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
        st.dots = xs.map((x, k) => {
          const dot = svgEl('circle', { cx: X(x), cy: Y(ys[k]), r: x === st.hov ? 5.5 : 3.6, fill: opts.color, stroke: 'var(--bg)', 'stroke-width': 2 }, svg);
          const hit = svgEl('rect', { x: X(x) - 11, y: top, width: 22, height: H - top - b, class: 'hit' }, svg);
          hit.setAttribute('aria-label', opts.tipText(x, ys[k]));
          const on = () => st.setHov(x);
          hit.addEventListener('mouseenter', on); hit.addEventListener('focus', on);
          bindTip(hit, fig, () => opts.tipHtml(x, st.ys[k], st.ys));
          return dot;
        });
        st.gl = svgEl('g', { class: 'glyph' }, svg);
        st.glab = text(svg, 50, top + 76, '', 'reflab', 'middle');
        st.drawGlyph();
      };
      st.drawGlyph = () => {
        st.gl.innerHTML = '';
        opts.glyph(st.gl, 50, top0 + 32, 26, st.hov);
        st.glab.textContent = opts.glyphLabel(st.hov);
      };
      st.setHov = x => {
        if (st.hov === x) return;
        st.hov = x;
        st.dots.forEach((d, k) => d.setAttribute('r', xs[k] === x ? 5.5 : 3.6));
        st.drawGlyph();
      };
      return st;
    }
    const top0 = 14;
    const A = panel($$('svg', fig)[0], NS1, {
      color: 'var(--fg2)', hov: 16, xlabel: 'decoder directions: the basis, then directions in its span',
      xt: x => x % 2 === 0,
      tipText: (x, y) => `${x} directions: risk ${y.toFixed(4)}`,
      tipHtml: (x, y, ys) => `<b>${x} directions</b><div class="row"><span>risk R(D)</span><b>${y.toFixed(4)}</b></div><div class="row"><span class="sub">vs. the basis</span><span>${U.signed(y - ys[0], 4)}</span></div>`,
      glyph: (g, gx, gy, gr, n) => {
        svgEl('circle', { cx: gx, cy: gy, r: gr, fill: 'none', stroke: 'var(--rule-strong)' }, g);
        T.NESTED.slice(0, n).forEach((a, k) => { const c = Math.cos(a * DEG), s = Math.sin(a * DEG); svgEl('line', { x1: gx - c * gr, y1: gy + s * gr, x2: gx + c * gr, y2: gy - s * gr, stroke: k < 2 ? 'var(--ink)' : 'var(--fg4)', 'stroke-width': k < 2 ? 1.6 : 1 }, g); });
      },
      glyphLabel: n => `${n} directions`,
    });
    const B = panel($$('svg', fig)[1], NS2, {
      color: 'var(--sasa)', hov: 4, xlabel: 'blocks the circle is split across',
      xt: () => true,
      tipText: (x, y) => `${x} blocks: objective ${y.toFixed(4)}`,
      tipHtml: (x, y, ys) => `<b>${x} block${x > 1 ? 's' : ''}</b><div class="row"><span>lowest objective</span><b>${y.toFixed(4)}</b></div><div class="row"><span class="sub">vs. one block</span><span>${U.signed(y - ys[0], 4)}</span></div>`,
      glyph: (g, gx, gy, gr, n) => {
        for (let k = 0; k < n; k++) {
          const a0 = TAU * k / n, a1 = TAU * (k + 1) / n, gap = n > 1 ? 0.07 : 0;
          if (n === 1) svgEl('circle', { cx: gx, cy: gy, r: gr, fill: 'none', stroke: 'var(--sasa)', 'stroke-width': 6 }, g);
          else svgEl('path', { d: arcPath(gx, gy, gr, a0 + gap, a1 - gap), fill: 'none', stroke: k % 2 ? 'var(--sasa-mid)' : 'var(--sasa)', 'stroke-width': 6 }, g);
        }
      },
      glyphLabel: n => `${n} block${n > 1 ? 's' : ''}`,
    });
    let lam = 0.3, lamd = 0.2;
    const upd1 = () => { v1.textContent = lam.toFixed(2); A.ys = NS1.map(N => T.riskL1(T.nestedDict(N), lam, 360)); A.render(); };
    const upd2 = () => { v2.textContent = lamd.toFixed(2); B.ys = NS2.map(b => T.sasaSplit(b, lamd)); B.render(); };
    let p1 = false, p2 = false;
    i1.addEventListener('input', () => { lam = +i1.value; if (!p1) { p1 = true; requestAnimationFrame(() => { p1 = false; upd1(); }); } });
    i2.addEventListener('input', () => { lamd = +i2.value; if (!p2) { p2 = true; requestAnimationFrame(() => { p2 = false; upd2(); }); } });
    A.ys = NS1.map(N => T.riskL1(T.nestedDict(N), lam, 360)); B.ys = NS2.map(b => T.sasaSplit(b, lamd));
    v1.textContent = lam.toFixed(2); v2.textContent = lamd.toFixed(2);
    const [c1, c2] = $$('.pref-chart', fig);
    responsive(c1, 280, (w, a) => { A.W = w; A.avail = a; A.render(); });
    responsive(c2, 280, (w, a) => { B.W = w; B.avail = a; B.render(); });
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════════
  // Architecture: scalar TopK versus Top-s groups, at the same budget
  // ═══════════════════════════════════════════════════════════════════════════════════════════
  function arch(fig) {
    fig.innerHTML = `<div class="scroll-x"><svg class="chart arch-svg" role="img" aria-label="A standard SAE keeps the 6 largest of 24 scalar latents; SASA keeps the 2 largest of 8 groups of 3, the same 6 coordinates"></svg></div>`;
    const svg = $('svg', fig), host = svg.parentElement;
    // toy pre-activations: 8 groups of 3 coordinates
    const P = [[0.2, 0.9, 0.3], [0.1, 0.2, 0.1], [0.7, 0.6, 0.65], [0.15, 0.1, 0.3], [0.85, 0.2, 0.5], [0.3, 0.1, 0.2], [0.2, 0.75, 0.15], [0.1, 0.25, 0.1]];
    const flat = P.flat(), topk = new Set(flat.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 6).map(x => x[1]));
    const norms = P.map(g => Math.hypot(...g)), tops = new Set(norms.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 2).map(x => x[1]));
    function render(W, avail) {
      const H = 276;
      sizeSvg(svg, W, H, avail); svg.innerHTML = '';
      const lx = 18, cell = Math.min(15, (W - 260) / 30), gapG = cell * 0.65, x0 = 132;
      const rowY = [70, 214];
      const vec = (x, y, n, label, sub) => {
        for (let i = 0; i < n; i++) svgEl('rect', { x, y: y - n * 6 + i * 12, width: 12, height: 10, rx: 2, fill: 'var(--bg-subtle)', stroke: 'var(--rule-strong)' }, svg);
        mathText(svg, x + 6, y + n * 6 + 16, label, 'mlabel', 'middle');
        if (sub) text(svg, x + 6, y + n * 6 + 30, sub, 'reflab', 'middle');
      };
      const arrowR = (xa, xb, y, lbl) => {
        svgEl('line', { x1: xa, x2: xb - 7, y1: y, y2: y, stroke: 'var(--fg4)', 'stroke-width': 1.3 }, svg);
        svgEl('path', { d: `M${xb},${y} l-8,-4 v8 z`, fill: 'var(--fg4)' }, svg);
        if (lbl) mathText(svg, (xa + xb) / 2, y - 8, lbl, 'mlabel', 'middle');
      };
      text(svg, lx, rowY[0] - 50, 'Standard SAE (TopK): keep the 6 largest of 24 scalar latents', 'ptitle');
      text(svg, lx, rowY[1] - 56, 'SASA: keep the 2 groups with the largest norms, 6 coordinates in all', 'ptitle');
      // row 1
      vec(lx + 10, rowY[0], 5, [{ m: 'h', b: 1 }]);
      arrowR(lx + 30, x0 - 8, rowY[0], [{ m: 'E', b: 1 }]);
      let x = x0;
      flat.forEach((v, i) => {
        const on = topk.has(i), hgt = 6 + v * 22;
        svgEl('rect', { x, y: rowY[0] - hgt / 2, width: cell - 2, height: hgt, rx: 2, fill: on ? 'var(--ink)' : 'var(--cell-b)' }, svg);
        x += cell;
      });
      const xEnd = x;
      arrowR(xEnd + 6, xEnd + 58, rowY[0], [{ m: 'D', b: 1 }]);
      vec(xEnd + 64, rowY[0], 5, [{ m: 'ĥ', b: 1 }]);
      text(svg, (x0 + xEnd) / 2, rowY[0] + 36, 'any 6 coordinates may win, so a ring can be read by different latents at different points', 'reflab', 'middle');
      // row 2
      vec(lx + 10, rowY[1], 5, [{ m: 'h', b: 1 }]);
      arrowR(lx + 30, x0 - 8, rowY[1], [{ m: 'E', b: 1 }, { s: 'k' }]);
      x = x0;
      const gx = [];
      P.forEach((g, k) => {
        const on = tops.has(k), xs = x;
        g.forEach(v => {
          const hgt = 6 + v * 22;
          svgEl('rect', { x, y: rowY[1] - hgt / 2, width: cell - 2, height: hgt, rx: 2, fill: on ? 'var(--sasa)' : 'var(--cell-b)' }, svg);
          x += cell;
        });
        // group norm bar above the group
        const bw = 3 * cell - 2, nh = norms[k] * 16;
        svgEl('rect', { x: xs, y: rowY[1] - 30 - nh, width: bw, height: nh, rx: 2, fill: on ? 'var(--sasa-mid)' : 'var(--rule-strong)' }, svg);
        if (on) svgEl('rect', { x: xs - 3, y: rowY[1] - 20, width: bw + 6, height: 40, rx: 5, fill: 'none', stroke: 'var(--sasa)', 'stroke-width': 1.4 }, svg);
        gx.push(xs + bw / 2);
        x += gapG;
      });
      text(svg, x0 - 6, rowY[1] - 38, 'group norms', 'reflab', 'end');
      const xEnd2 = x - gapG;
      arrowR(xEnd2 + 6, xEnd2 + 58, rowY[1], [{ m: 'D', b: 1 }, { s: 'k' }]);
      vec(xEnd2 + 64, rowY[1], 5, [{ m: 'ĥ', b: 1 }]);
      text(svg, (x0 + xEnd2) / 2, rowY[1] + 38, 'a whole group turns on or off together; its 3 coordinates say where on the feature the input lies', 'reflab', 'middle');
    }
    responsive(host, 640, (w, a) => render(w, a));
  }

  const builders = { cover, covering, certificate, prefs, arch };
  function init() {
    const nodes = $$('[data-fig]');
    const first = nodes.filter(n => n.dataset.fig === 'cover');
    first.forEach(n => { try { builders.cover(n); } catch (e) { console.error('fig cover', e); } });
    U.lazy(nodes.filter(n => n.dataset.fig !== 'cover'), n => { try { builders[n.dataset.fig](n); } catch (e) { console.error('fig', n.dataset.fig, e); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
