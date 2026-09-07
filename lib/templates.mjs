// The template layer — plain JavaScript functions that return HTML strings.
//
// No template engine on purpose: every page is just a function you can read
// and bend. `ctx` (see makeContext) carries the site config plus URL helpers
// so links respect the deploy baseUrl.
//
// The visual language borrows from Stripe's *Increment* magazine: a clean
// grotesque sans for UI/meta (tracked caps eyebrows, bylines), serif display
// + serif body for reading, a per-theme accent colour, and a mixed article
// grid (a big lead followed by feature/brief blocks).

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
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
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
  const initials = site.author.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return `<header class="site-header">
    <div class="wrap site-header__inner">
      <a class="site-header__brand" href="${ctx.url("/")}">
        <span class="site-header__mark" aria-hidden="true">${escapeHtml(initials)}</span>
        <span class="site-header__word">
          <span class="site-header__title">${escapeHtml(site.title)}</span>
          <span class="site-header__tagline">${escapeHtml(site.tagline)}</span>
        </span>
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
    .join("\n          ");
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
    <div class="wrap site-footer__inner">
      <div class="site-footer__about">
        <p class="site-footer__brand">${escapeHtml(site.title)}</p>
        <p class="note">${escapeHtml(site.about || site.description)}</p>
      </div>
      <nav class="site-footer__links" aria-label="Links do rodapé">
        <p class="eyebrow-label">Onde me achar</p>
        ${links}
      </nav>
    </div>
    <div class="wrap site-footer__base">
      <p class="note">© ${year} ${escapeHtml(site.author.name)}. Escrito com calma.</p>
    </div>
  </footer>`;
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

/** A tracked-caps eyebrow: coloured theme label + date. */
function eyebrow(ctx, post, { withDate = true } = {}) {
  const cat = post.categories?.[0];
  const parts = [];
  if (cat) {
    parts.push(
      `<a class="eyebrow-theme" style="--tc:${escapeHtml(cat.color)}" href="${ctx.url(`/categorias/${cat.slug}/`)}">${escapeHtml(cat.name)}</a>`,
    );
  }
  if (withDate && post.date) {
    parts.push(
      `<time datetime="${isoDate(post.date)}">${formatDate(post.date)}</time>`,
    );
  }
  if (!parts.length) return "";
  return `<p class="eyebrow">${parts.join('<span class="eyebrow-sep">·</span>')}</p>`;
}

/** Resolve a post's cover for use in a card (needs an absolute-ish path,
 *  since cards live off the post's own directory). */
function cardCover(ctx, post) {
  if (!post.cover) return "";
  const ref = post.cover;
  let src;
  if (/^([a-z]+:)?\/\//i.test(ref) || ref.startsWith("/")) {
    src = withBase(ctx.site.baseUrl, ref);
  } else {
    src = withBase(ctx.site.baseUrl, post.url + ref);
  }
  return `<div class="article-block__art"><img src="${escapeHtml(src)}" alt="${escapeHtml(post.coverAlt || "")}" loading="lazy" /></div>`;
}

/** One article block. variant: "lead" | "feature" | "brief". */
export function articleBlock(ctx, post, variant = "brief") {
  const art = variant === "brief" ? "" : cardCover(ctx, post);
  const titleClass = variant === "lead" ? "article-block__title serif" : "article-block__title";
  const introClass = "article-block__intro";
  const intro = post.summary
    ? `<p class="${introClass}">${escapeHtml(post.summary)}</p>`
    : "";
  const url = ctx.url(post.url);
  return `<li class="article-block article-block--${variant}">
        ${art}
        <div class="article-block__text">
          ${eyebrow(ctx, post)}
          <h3 class="${titleClass}"><a class="article-block__link" href="${url}">${escapeHtml(post.title)}</a></h3>
          ${intro}
        </div>
      </li>`;
}

/** Build a mixed magazine grid from posts: a lead, then feature/brief rhythm. */
function magGrid(ctx, posts, { lead = true } = {}) {
  if (!posts.length) {
    return `<p class="empty">Ainda não há nada por aqui. Volte em breve.</p>`;
  }
  const items = [];
  const cycle = ["feature", "feature", "brief", "brief", "brief", "brief"];
  posts.forEach((post, i) => {
    let variant;
    if (lead && i === 0) variant = "lead";
    else variant = cycle[(lead ? i - 1 : i) % cycle.length];
    items.push(articleBlock(ctx, post, variant));
  });
  return `<ul class="mag-grid">\n      ${items.join("\n      ")}\n      </ul>`;
}


// ---------------------------------------------------------------------------
// Post page
// ---------------------------------------------------------------------------

export function articleMain(ctx, post, related = []) {
  const metaParts = [
    `<span class="post-byline">por ${escapeHtml(ctx.site.author.name)}</span>`,
  ];
  if (post.date) {
    metaParts.push(
      `<time datetime="${isoDate(post.date)}">${formatDate(post.date)}</time>`,
    );
  }
  if (post.readingTime) {
    metaParts.push(`<span>${post.readingTime} min de leitura</span>`);
  }
  const metaHtml = metaParts.join('<span class="eyebrow-sep">·</span>');
  const themeLabel = post.categories?.length
    ? post.categories
        .map(
          (c) =>
            `<a class="eyebrow-theme" style="--tc:${escapeHtml(c.color)}" href="${ctx.url(`/categorias/${c.slug}/`)}">${escapeHtml(c.name)}</a>`,
        )
        .join('<span class="eyebrow-sep">·</span>')
    : "";
  const lede = post.summary
    ? `<p class="post-lede">${escapeHtml(post.summary)}</p>`
    : "";
  const hasCover = Boolean(post.cover);
  const accent = post.categories?.[0]?.color;

  let cover;
  if (hasCover) {
    const art = cardCover(ctx, post).replace(/^<div class="article-block__art">|<\/div>$/g, "");
    cover = `<figure class="post-cover">
      ${art}
      <div class="post-cover__overlay">
        ${themeLabel ? `<p class="eyebrow eyebrow--center">${themeLabel}</p>` : ""}
        <h1 class="post-cover__title">${escapeHtml(post.title)}</h1>
        ${lede ? `<p class="post-cover__lede">${escapeHtml(post.summary || "")}</p>` : ""}
        <p class="post-cover__meta">${metaHtml}</p>
      </div>
    </figure>`;
  } else {
    cover = "";
  }

  const continueReading = related.length
    ? `      <section class="continue wrap">
        <h2 class="eyebrow-label eyebrow-label--section">Continuar lendo</h2>
        <ul class="mag-grid mag-grid--briefs">
          ${related.map((p) => articleBlock(ctx, p, "brief")).join("\n          ")}
        </ul>
      </section>`
    : "";

  return `    <article class="post wrap"${accent ? ` style="--tc:${escapeHtml(accent)}"` : ""}>
      ${cover}
      <header class="post-header"${hasCover ? " hidden" : ""}>
        ${themeLabel ? `<p class="eyebrow eyebrow--center">${themeLabel}</p>` : ""}
        <h1 class="post-title">${escapeHtml(post.title)}</h1>
        ${lede}
        <p class="post-meta">${metaHtml}</p>
      </header>
      <div class="prose">
${post.html}
      </div>
      <footer class="post-footer">
        <a class="u-arrow" href="${ctx.url("/posts/")}">todos os escritos</a>
      </footer>
    </article>
${continueReading}`;
}

// ---------------------------------------------------------------------------
// Home & listings
// ---------------------------------------------------------------------------

export function homeMain(ctx, { posts }) {
  const featured = posts.slice(0, ctx.site.homeRecentCount);
  const more =
    posts.length > featured.length
      ? `<p class="see-all"><a class="u-arrow" href="${ctx.url("/posts/")}">ver todos os escritos</a></p>`
      : "";
  return `    <section class="feed feed--home wrap">
      ${magGrid(ctx, featured)}
      ${more}
    </section>`;
}

export function listMain(ctx, { title, lead, posts, accent }) {
  return `    <section class="page-head wrap"${accent ? ` style="--tc:${escapeHtml(accent)}"` : ""}>
      <h1 class="page-title${accent ? " page-title--themed" : ""}">${escapeHtml(title)}</h1>
      ${lead ? `<p class="page-lead">${escapeHtml(lead)}</p>` : ""}
    </section>
    <section class="feed wrap">
      ${magGrid(ctx, posts)}
    </section>`;
}

export function categoriesIndexMain(ctx, { categories }) {
  const items = categories
    .map(
      (c) =>
        `<li><a style="--tc:${escapeHtml(c.color)}" href="${ctx.url(`/categorias/${c.slug}/`)}"><span class="cat-dot"></span><span class="cat-name">${escapeHtml(c.name)}</span><span class="cat-count">${c.count}</span></a></li>`,
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
