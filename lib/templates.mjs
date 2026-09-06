// The template layer — plain JavaScript functions that return HTML strings.
//
// No template engine on purpose: every page is just a function you can read
// and bend. `ctx` (see makeContext) carries the site config plus URL helpers
// so links respect the deploy baseUrl.

import { escapeHtml, withBase, formatDate, isoDate } from "./util.mjs";

export function makeContext(site) {
  return {
    site,
    /** Resolve a root-relative path against baseUrl. */
    url: (href) => withBase(site.baseUrl, href),
    /** Resolve an asset under /assets. */
    asset: (p) => withBase(site.baseUrl, "/assets/" + p.replace(/^\/+/, "")),
  };
}

// ---------------------------------------------------------------------------
// Base document
// ---------------------------------------------------------------------------

export function layout(ctx, page) {
  const { site } = ctx;
  const {
    title,
    description = site.description,
    bodyClass = "",
    head = "",
    main = "",
    canonicalPath = "/",
    ogImage,
  } = page;

  const fullTitle = title ? `${title} — ${site.title}` : site.title;
  const canonical = withBase(site.baseUrl, canonicalPath);

  return `<!doctype html>
<html lang="${escapeHtml(site.language)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="author" content="${escapeHtml(site.author.name)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(site.title)}" />
  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.title)}" href="${withBase(site.baseUrl, "/feed.xml")}" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${ctx.asset("styles/main.css")}" />
  ${head}
</head>
<body class="${escapeHtml(bodyClass)}">
  <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  ${siteHeader(ctx)}
  <main id="conteudo" class="site-main">
${main}
  </main>
  ${siteFooter(ctx)}
</body>
</html>
`;
}

function siteHeader(ctx) {
  const { site } = ctx;
  const links = site.nav
    .map(
      (item) =>
        `<li><a href="${ctx.url(item.href)}">${escapeHtml(item.label)}</a></li>`,
    )
    .join("\n        ");
  return `<header class="site-header">
    <div class="wrap site-header__inner">
      <a class="site-header__brand" href="${ctx.url("/")}">
        <span class="site-header__title">${escapeHtml(site.title)}</span>
        <span class="site-header__tagline">${escapeHtml(site.tagline)}</span>
      </a>
      <nav class="site-nav" aria-label="Navegação principal">
        <ul>
        ${links}
        </ul>
      </nav>
    </div>
  </header>`;
}

function siteFooter(ctx) {
  const { site } = ctx;
  const links = site.social
    .map(
      (item) =>
        `<a href="${ctx.url(item.href)}">${escapeHtml(item.label)}</a>`,
    )
    .join("\n        ");
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
    <div class="wrap site-footer__inner">
      <p class="site-footer__meta">© ${year} ${escapeHtml(site.author.name)}. Escrito com calma.</p>
      <nav class="site-footer__links" aria-label="Links do rodapé">
        ${links}
      </nav>
    </div>
  </footer>`;
}

// ---------------------------------------------------------------------------
// Post pieces
// ---------------------------------------------------------------------------

function categoryPills(ctx, post) {
  if (!post.categories?.length) return "";
  const pills = post.categories
    .map(
      (c) =>
        `<a class="pill" href="${ctx.url(`/categorias/${c.slug}/`)}">${escapeHtml(c.name)}</a>`,
    )
    .join("");
  return `<div class="post-cats">${pills}</div>`;
}

/** Full article body for a single post page. */
export function articleMain(ctx, post) {
  const cats = categoryPills(ctx, post);
  const time = post.date
    ? `<time datetime="${isoDate(post.date)}">${formatDate(post.date)}</time>`
    : "";
  const reading = post.readingTime
    ? `<span class="dot">·</span><span>${post.readingTime} min de leitura</span>`
    : "";
  const lede = post.summary
    ? `<p class="post-lede">${escapeHtml(post.summary)}</p>`
    : "";
  const cover = post.cover
    ? `<figure class="post-cover"><img src="${resolvePostAsset(ctx, post, post.cover)}" alt="${escapeHtml(post.coverAlt || "")}" />${post.coverCaption ? `<figcaption>${escapeHtml(post.coverCaption)}</figcaption>` : ""}</figure>`
    : "";

  return `    <article class="post wrap">
      <header class="post-header">
        ${cats}
        <h1 class="post-title">${escapeHtml(post.title)}</h1>
        ${lede}
        <p class="post-meta">
          <span class="post-byline">por ${escapeHtml(ctx.site.author.name)}</span>
          <span class="dot">·</span>${time}${reading}
        </p>
      </header>
      ${cover}
      <div class="prose">
${post.html}
      </div>
      <footer class="post-footer">
        <a class="back-link" href="${ctx.url("/posts/")}">← todos os escritos</a>
      </footer>
    </article>`;
}

/** Compact card used in listings. */
export function postCard(ctx, post) {
  const time = post.date
    ? `<time datetime="${isoDate(post.date)}">${formatDate(post.date)}</time>`
    : "";
  const cats = post.categories?.length
    ? `<span class="card-cat">${escapeHtml(post.categories[0].name)}</span>`
    : "";
  const summary = post.summary
    ? `<p class="card-summary">${escapeHtml(post.summary)}</p>`
    : "";
  return `<article class="card">
      <p class="card-meta">${time}${cats ? `<span class="dot">·</span>${cats}` : ""}</p>
      <h2 class="card-title"><a href="${ctx.url(post.url)}">${escapeHtml(post.title)}</a></h2>
      ${summary}
      <a class="card-more" href="${ctx.url(post.url)}">continuar lendo →</a>
    </article>`;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export function homeMain(ctx, { posts, intro }) {
  const recent = posts.slice(0, ctx.site.homeRecentCount);
  const cards = recent.map((p) => postCard(ctx, p)).join("\n      ");
  const more =
    posts.length > recent.length
      ? `<p class="see-all"><a href="${ctx.url("/posts/")}">ver todos os escritos →</a></p>`
      : "";
  return `    <section class="hero wrap">
      <div class="prose hero__prose">
${intro}
      </div>
    </section>
    <section class="feed wrap">
      <h2 class="section-label">Escritos recentes</h2>
      <div class="card-grid">
      ${cards}
      </div>
      ${more}
    </section>`;
}

export function listMain(ctx, { title, lead, posts }) {
  const cards = posts.map((p) => postCard(ctx, p)).join("\n      ");
  const empty = `<p class="empty">Ainda não há nada por aqui. Volte em breve.</p>`;
  return `    <section class="page-head wrap">
      <h1 class="page-title">${escapeHtml(title)}</h1>
      ${lead ? `<p class="page-lead">${escapeHtml(lead)}</p>` : ""}
    </section>
    <section class="feed wrap">
      ${posts.length ? `<div class="card-grid">\n      ${cards}\n      </div>` : empty}
    </section>`;
}

export function categoriesIndexMain(ctx, { categories }) {
  const items = categories
    .map(
      (c) =>
        `<li><a href="${ctx.url(`/categorias/${c.slug}/`)}"><span class="cat-name">${escapeHtml(c.name)}</span><span class="cat-count">${c.count}</span></a></li>`,
    )
    .join("\n        ");
  return `    <section class="page-head wrap">
      <h1 class="page-title">Temas</h1>
      <p class="page-lead">Assuntos que atravessam os escritos.</p>
    </section>
    <section class="wrap">
      <ul class="cat-list">
        ${items}
      </ul>
    </section>`;
}

/** Free-form page (about, etc.) rendered from Markdown/HTML. */
export function pageMain(ctx, page) {
  return `    <article class="page wrap">
      <header class="page-head">
        <h1 class="page-title">${escapeHtml(page.title)}</h1>
        ${page.summary ? `<p class="page-lead">${escapeHtml(page.summary)}</p>` : ""}
      </header>
      <div class="prose">
${page.html}
      </div>
    </article>`;
}

// ---------------------------------------------------------------------------

/** Resolve an asset path referenced from a post's front-matter (cover, etc.).
 *  Absolute/root paths pass through withBase; bare names are relative to the
 *  post's own output directory (so they sit beside index.html). */
function resolvePostAsset(ctx, post, ref) {
  if (/^([a-z]+:)?\/\//i.test(ref) || ref.startsWith("/")) {
    return withBase(ctx.site.baseUrl, ref);
  }
  return ref; // relative to the post directory
}
