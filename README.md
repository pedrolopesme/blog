# Margens

An authorial, editorial-first blog about technology, craft, and ideas —
built as a static site with a tiny, dependency-light generator and deployed to
GitHub Pages on every push.

No framework, no database, no runtime. Content in, static HTML out.

## Quick start

```bash
make install     # install dependencies
make dev         # build for local preview + serve at http://localhost:4321
```

To create a new post:

```bash
make new title="Título do post" cat="Ensaios,Ofício"
# add html=1 to scaffold a raw-HTML post instead of Markdown
```

Posts are created as **drafts** (`draft: true`). Remove that line to publish.
Preview drafts locally with `make drafts`.

## How it works

`build.mjs` reads everything under `src/content/`, renders it through the
template layer in `lib/`, and writes a complete static site to `dist/`.

```
src/
  content/
    home.md                     intro prose on the home page
    posts/<slug>/index.md       a post (Markdown or index.html)
              style.css, *.js   co-located, post-specific assets (optional)
    pages/<slug>.md             standalone pages (e.g. sobre.md → /sobre/)
  styles/main.css               the global editorial stylesheet
  assets/                       site-wide images, fonts, favicons
lib/                            markdown pipeline, templates, helpers
scripts/                        static preview server, post scaffolder
build.mjs                       the generator
site.config.js                  title, nav, author, deploy base URL
```

Generated URLs are permanent and clean:

| Page              | URL                        |
| ----------------- | -------------------------- |
| Home              | `/`                        |
| All posts         | `/posts/`                  |
| A post            | `/posts/<slug>/`           |
| Themes index      | `/categorias/`             |
| A theme           | `/categorias/<slug>/`      |
| A standalone page | `/<slug>/`                 |
| Feed / sitemap    | `/feed.xml`, `/sitemap.xml`|

## Writing a post

A post is a directory under `src/content/posts/` containing `index.md`
(Markdown) or `index.html` (raw HTML). Both start with YAML front-matter:

```yaml
---
title: "O título do post"
date: 2026-09-05
categories: ["Ensaios", "Ofício"]
summary: "Uma frase que aparece nas listagens e no <head>."
draft: false
# --- optional, per-post extras ---
styles: ["style.css"]      # stylesheets loaded only on this page
scripts: ["grafico.js"]    # scripts loaded only on this page
theme: "escuro"            # adds body class .theme-escuro
cover: "capa.jpg"          # co-located cover image
coverAlt: "Descrição da imagem"
---
```

Everything after the front-matter is the body. In Markdown you can freely mix
raw HTML, `<style>`, `<script>`, and per-post widgets — that is what lets each
post look and behave uniquely while sharing the same structure and typography.

### Reusable components

Attach classes to any element with `{.class}` (Markdown) or write the HTML
directly. The stylesheet ships these building blocks:

| Component      | How to use                                             |
| -------------- | ------------------------------------------------------ |
| Drop cap       | `<p class="dropcap">…</p>` on the first paragraph      |
| Pull quote     | `> Uma frase forte.` + `{.pullquote}`                  |
| Callout / note | `<aside class="callout callout--note">…</aside>` (`--warn`, `--tip`) |
| Wide media     | `![alt](img){.wide}` or `.bleed` to break the measure  |
| Figure         | `<figure class="figure"><img …><figcaption>…</figcaption></figure>` |
| Code block     | fenced ` ```lang ` — syntax-highlighted at build time  |

### Post-specific elements

For something that exists in only one post — a chart, a diagram, an interactive
widget — put its CSS/JS **beside the post** and declare them in front-matter:

```
src/content/posts/meu-post/
  index.md            # references styles/scripts in front-matter
  style.css           # loaded only here
  grafico.js          # loaded only here
  imagem.png          # copied next to the published page
```

Co-located files are copied verbatim into the published post directory, so you
reference them by bare name (`grafico.js`, `imagem.png`). See the seed post
`src/content/posts/ola-mundo/` for a working example (a dependency-free chart).

## Configuration

Edit `site.config.js` for the title, tagline, navigation, author, and social
links. Deploy-time values come from environment variables:

- `BASE_URL` — path the site is mounted on. Production is a GitHub Pages
  *project* site, served under `/blog/`, so the CI build passes `/blog`.
  Local builds use `/`.
- `SITE_URL` — absolute origin for `feed.xml` / `sitemap.xml` canonical links.

## Deployment

`.github/workflows/deploy.yml` builds and publishes on every push to `main`,
so **each commit publishes a new version** of the site. The workflow derives
`BASE_URL` from the Pages configuration automatically, so a repository rename
needs no code change.

One-time setup in the GitHub repo:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Push to `main`. The site goes live at `https://pedrolopesme.github.io/blog/`.

To serve from the repository root instead (a user site named
`pedrolopesme.github.io`), rename the repo — the pipeline adapts on its own.

## Make targets

| Command                     | Effect                                    |
| --------------------------- | ----------------------------------------- |
| `make dev`                  | local build (base `/`) + preview server   |
| `make build`                | production build into `dist/`             |
| `make serve`                | serve an existing `dist/`                 |
| `make new title="…"`        | scaffold a new post                       |
| `make drafts`               | preview including drafts                  |
| `make clean`                | remove `dist/`                            |
