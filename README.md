# Promptoo

Free AI video and image prompt builder by [Avan Labs](https://avanlabs.com). Static site, no build step, no backend.
Live at https://promptoo.avanlabs.com

## Pages
| file | what |
|---|---|
| `index.html` | home page (SEO, FAQ, structured data) |
| `app.html` | the prompt builder tool |
| `camera-movements.html`, `camera-angles-and-shots.html` | reference guides, generated from the app's data |
| `terms.html`, `privacy.html`, `contact.html`, `404.html` | legal and contact |
| `robots.txt`, `sitemap.xml`, `llms.txt` | search and AI-crawler files |

## Folders
`stage/` 3D engine · `effects/` 3D effects (see `effects/README.md`) · `vendor/` Three.js r147 (MIT) · `partials/` shared header and footer · `tools/` helper scripts · `img/`

## Keeping things consistent
- **Header and footer** live in `partials/`. After editing them run `python tools/stamp.py` to copy them into every page.
- **Guides** are generated from `camera.js` and `app.html`: `node tools/build-guides.js`, then `python tools/stamp.py`.
- **Site check** (links, anchors, titles, descriptions, structured data): `node tools/check-site.js`.
- Footer links, projects list and copyright line: `partials/footer.html`.

## Deploy (Cloudflare Pages or any static host)
Publish the repository root. No build command. Point `promptoo.avanlabs.com` at it.
`_headers` is read by Cloudflare Pages. Open `index.html` directly from disk to try it locally.

## Licence
Free for personal use. Commercial use needs permission, see `terms.html`. Three.js is MIT licensed.
