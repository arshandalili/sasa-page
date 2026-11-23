# SASA project page

Static project page for *Subspace-Aware Sparse Autoencoders for Effective Mechanistic Interpretability* (NeurIPS 2026, [arXiv:2606.06333](https://arxiv.org/abs/2606.06333)). No build step: plain HTML, CSS and JavaScript. KaTeX and the fonts load from public CDNs.

## Preview locally

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

Open it through a server rather than as a `file://` URL, so that fonts and scripts load the same way they will on GitHub Pages.

## Deploy on Cloudflare

The site is deployed from the GitHub repository `arshandalili/sasa-page` by Cloudflare (Workers & Pages → Create → Import a repository). There is no build step: leave the build command empty and set the output directory to `/`. Every push to `main` redeploys the site.

The social-preview tags in `index.html` (`og:image`, `twitter:image`) should hold absolute URLs on the final address, because link previews need them.

## Layout

| Path | Contents |
|---|---|
| `index.html` | The article. All math is TeX between `$…$` / `$$…$$`, typeset by KaTeX; shared macros live in `static/js/page.js`. |
| `static/css/site.css` | Typography, layout, figure and chart styles. Colors are CSS variables at the top; SASA is green and each vector SAE keeps one hue. |
| `static/js/util.js` | Shared helpers: SVG drawing, tooltips, responsive sizing, model colors and marker shapes. |
| `static/js/toy.js` | The math behind the toy figures: exact ℓ1 codes and risk, the SASA objective for a routing of the slice, and covering counts for the circle and sphere. |
| `static/js/figs.js` | Method figures: the months ring, covering by lines (Theorem 1), the inactivity certificate (Theorem 2, Proposition 2), the two objectives (Theorem 3), and the architecture diagram. |
| `static/js/charts.js` | Result charts and the token-level explorer. Numbers are copied from the paper's tables; per-token group norms and timing bars are read from the paper's figures. |
| `static/img/` | Logo, favicon, social preview (`cover.png`), and figures exported from the paper's PDF sources. |

The toy figures work on a feature slice of radius `t = 1`. On the sphere, the number of directions comes from a Fibonacci-lattice covering, which is an upper bound on the minimum; the table is precomputed in `toy.js`.
