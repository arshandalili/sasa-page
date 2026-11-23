/* The math behind the toy figures. Everything is computed on a feature slice of radius t = 1:
 *   - the l1-regularized risk with optimal codes (Section 3.2 of the paper), by coordinate descent,
 *   - the SASA population objective for a fixed routing of the slice (Theorem 3),
 *   - covering numbers of the circle and the sphere by lines through the origin (Theorem 1).
 */
window.SasaToy = (function () {
  'use strict';
  const TAU = 2 * Math.PI, GA = Math.PI * (3 - Math.sqrt(5));
  const soft = (z, lam) => (z > lam ? z - lam : z < -lam ? z + lam : 0);
  const unit = deg => [Math.cos(deg * Math.PI / 180), Math.sin(deg * Math.PI / 180)];

  // ── l1 codes ────────────────────────────────────────────────────────────────────────────────
  // min_a ½‖h − D a‖² + λ‖a‖₁ for unit-norm 2-D atoms D (array of [x, y]); a0 warm-starts the descent
  function lasso(h, D, lam, a0) {
    const n = D.length, a = a0 ? a0.slice() : new Array(n).fill(0);
    let rx = h[0], ry = h[1];
    for (let j = 0; j < n; j++) { rx -= a[j] * D[j][0]; ry -= a[j] * D[j][1]; }
    for (let sweep = 0; sweep < 600; sweep++) {
      let delta = 0;
      for (let j = 0; j < n; j++) {
        const dx = D[j][0], dy = D[j][1], z = a[j] + dx * rx + dy * ry, nv = soft(z, lam), ch = nv - a[j];
        if (ch !== 0) { rx -= ch * dx; ry -= ch * dy; a[j] = nv; delta = Math.max(delta, Math.abs(ch)); }
      }
      if (delta < 1e-12) break;
    }
    let l1 = 0; for (let j = 0; j < n; j++) l1 += Math.abs(a[j]);
    return { loss: 0.5 * (rx * rx + ry * ry) + lam * l1, a, r: [rx, ry] };
  }
  const thetas = n => Array.from({ length: n }, (_, i) => TAU * (i + 0.5) / n);
  // population risk R(D) under the uniform distribution on the unit circle
  function riskL1(D, lam, n = 720) {
    let s = 0, a = null;
    for (const th of thetas(n)) { const o = lasso([Math.cos(th), Math.sin(th)], D, lam, a); a = o.a; s += o.loss; }
    return s / n;
  }
  // basis code in closed form (soft thresholding), Lemma 4
  function basisCode(h, lam) { return [soft(h[0], lam), soft(h[1], lam)]; }
  // nested dictionaries: the basis, then bisecting directions inside its span
  const NESTED = [0, 90, 45, 135, 22.5, 67.5, 112.5, 157.5, 11.25, 33.75, 56.25, 78.75, 101.25, 123.75, 146.25, 168.75];
  const nestedDict = N => NESTED.slice(0, N).map(unit);

  // ── SASA objective for a routing partition ─────────────────────────────────────────────────
  // per-direction cost of a block with second-moment eigenvalue mu: min_w mu(1−w)² + λ|w|
  const gcost = (mu, lam) => (mu > lam / 2 ? lam - lam * lam / (4 * mu) : mu);
  // second moment E[h hᵀ 1{θ ∈ [a, b)}] for h uniform on the unit circle
  function arcMoment(a, b) {
    const k = 1 / TAU;
    const m11 = k * ((b - a) / 2 + (Math.sin(2 * b) - Math.sin(2 * a)) / 4);
    const m22 = k * ((b - a) / 2 - (Math.sin(2 * b) - Math.sin(2 * a)) / 4);
    const m12 = k * (-(Math.cos(2 * b) - Math.cos(2 * a)) / 4);
    const tr = (m11 + m22) / 2, dd = Math.sqrt(((m11 - m22) / 2) ** 2 + m12 * m12);
    return [tr + dd, Math.max(0, tr - dd)];
  }
  // lowest objective any blocks can reach when the circle is split into b equal arcs (one block per arc)
  function sasaSplit(b, lam) {
    let s = 0;
    for (let k = 0; k < b; k++) arcMoment(TAU * k / b, TAU * (k + 1) / b).forEach(mu => { s += gcost(mu, lam); });
    return s;
  }
  // single block: d_i λ − d_i² λ² / (4 t²) with d_i = 2, t = 1
  const sasaSingle = lam => 2 * lam - lam * lam;

  // ── covering by lines ──────────────────────────────────────────────────────────────────────
  // exact minimum number of lines through the origin within angle β of every point of a circle
  const circleN = beta => Math.ceil(Math.PI / (2 * beta) - 1e-9);
  // directions used by a Fibonacci-lattice covering of the sphere, for covering angles 3°, 3.25°, ..., 45°
  const SPHERE = [1350, 1160, 1060, 970, 900, 790, 650, 610, 580, 475, 445, 430, 365, 330, 300, 275, 260, 235, 220, 205, 192, 188, 182, 178, 162, 158, 156, 152, 148, 144, 136, 130, 124, 114, 112, 108, 102, 92, 86, 80, 76, 74, 70, 68, 68, 66, 62, 62, 60, 59, 58, 57, 55, 54, 53, 52, 51, 48, 47, 44, 43, 43, 40, 40, 39, 38, 37, 36, 35, 34, 34, 33, 33, 32, 32, 31, 30, 30, 30, 28, 27, 27, 25, 25, 25, 24, 24, 23, 22, 22, 22, 22, 21, 21, 20, 19, 18, 17, 17, 16, 16, 16, 15, 15, 15, 15, 14, 14, 14, 14, 13, 13, 13, 13, 13, 13, 12, 12, 12, 12, 12, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 9, 9, 9, 9, 8, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7];
  function sphereN(beta) {
    const deg = beta * 180 / Math.PI, k = Math.floor((deg - 3) / 0.25 + 1e-9);
    return SPHERE[Math.max(0, Math.min(SPHERE.length - 1, k))];
  }
  function fibHemi(N) {
    const out = [];
    for (let i = 0; i < N; i++) { const z = (i + 0.5) / N, r = Math.sqrt(1 - z * z), p = i * GA; out.push([r * Math.cos(p), r * Math.sin(p), z]); }
    return out;
  }
  function fibSphere(M) {
    const out = [];
    for (let i = 0; i < M; i++) { const z = 1 - 2 * (i + 0.5) / M, r = Math.sqrt(1 - z * z), p = i * GA; out.push([r * Math.cos(p), r * Math.sin(p), z]); }
    return out;
  }

  return { TAU, soft, unit, lasso, thetas, riskL1, basisCode, NESTED, nestedDict, gcost, arcMoment, sasaSplit, sasaSingle, circleN, sphereN, fibHemi, fibSphere };
})();
