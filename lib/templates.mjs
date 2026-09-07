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

  <link rel="icon" type="image/png" sizes="32x32" href="${ctx.asset("favicon-32.png")}" />
  <link rel="icon" type="image/png" sizes="16x16" href="${ctx.asset("favicon-16.png")}" />
  <link rel="apple-touch-icon" sizes="180x180" href="${ctx.asset("apple-touch-icon.png")}" />

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
  return `<header class="site-header">
    <div class="wrap site-header__inner">
      <a class="site-header__brand" href="${ctx.url("/")}">
        <img class="site-header__logo" src="${ctx.asset("logo.png")}" alt="${escapeHtml(site.title)}" width="40" height="40" />
        <span class="site-header__word">
          <span class="site-header__title">Blog</span>
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
  const hasBackground = Boolean(post.background);
  const accent = post.categories?.[0]?.color;

  let cover;
  if (hasCover) {
    const bgSrc = hasBackground
      ? ctx.url(`/posts/${post.slug}/${post.background}`)
      : "";
    const bgStyle = hasBackground
      ? ` style="background-image: url('${bgSrc}'); background-size: cover; background-position: center;"`
      : "";
    const art = hasBackground
      ? ""
      : cardCover(ctx, post).replace(/^<div class="article-block__art">|<\/div>$/g, "");
    cover = `<figure class="post-cover"${bgStyle}>
      ${art}
      <div class="post-cover__overlay">
        ${themeLabel ? `<p class="eyebrow eyebrow--center">${themeLabel}</p>` : ""}
        <h1 class="post-cover__title">${escapeHtml(post.title)}</h1>
      </div>
    </figure>`;
  } else {
    cover = "";
  }

  const postIntro = hasCover
    ? `<div class="post-intro wrap">
        ${lede}
        <p class="post-meta">${metaHtml}</p>
      </div>`
    : "";

  const continueReading = related.length
    ? `      <section class="continue wrap">
        <h2 class="eyebrow-label eyebrow-label--section">Continuar lendo</h2>
        <ul class="mag-grid mag-grid--briefs">
          ${related.map((p) => articleBlock(ctx, p, "brief")).join("\n          ")}
        </ul>
      </section>`
    : "";

  return `${cover}
    ${postIntro}
    <header class="post-header wrap"${hasCover ? " hidden" : ""}>
      ${themeLabel ? `<p class="eyebrow eyebrow--center">${themeLabel}</p>` : ""}
      <h1 class="post-title">${escapeHtml(post.title)}</h1>
      ${lede}
      <p class="post-meta">${metaHtml}</p>
    </header>
    <article class="post wrap"${accent ? ` style="--tc:${escapeHtml(accent)}"` : ""}>
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
  if (!posts.length) {
    return `<p class="empty">Ainda não há nada por aqui. Volte em breve.</p>`;
  }

  const [hero, ...rest] = posts;
  const heroArt = cardCover(ctx, hero);
  const heroUrl = ctx.url(hero.url);
  const heroCat = hero.categories?.[0];

  // Build hero
  const heroHtml = `<section class="home-hero wrap">
    ${heroArt ? `<a class="home-hero__art" href="${heroUrl}">${heroArt.replace(/^<div class="article-block__art">|<\/div>$/g, "")}</a>` : ""}
    <div class="home-hero__body">
      ${heroCat ? `<p class="eyebrow"><a class="eyebrow-theme" style="--tc:${escapeHtml(heroCat.color)}" href="${ctx.url(`/categorias/${heroCat.slug}/`)}">${escapeHtml(heroCat.name)}</a></p>` : ""}
      <h2 class="home-hero__title"><a href="${heroUrl}">${escapeHtml(hero.title)}</a></h2>
      ${hero.summary ? `<p class="home-hero__excerpt">${escapeHtml(hero.summary)}</p>` : ""}
      ${hero.readingTime ? `<p class="home-hero__meta">${hero.readingTime} min de leitura</p>` : ""}
    </div>
  </section>`;

  // Group remaining posts by first category
  const groups = new Map();
  for (const post of rest) {
    const cat = post.categories?.[0] || { name: "Outros", slug: "outros", color: "#8a7c63" };
    const key = cat.slug;
    if (!groups.has(key)) groups.set(key, { cat, posts: [] });
    groups.get(key).posts.push(post);
  }

  const sections = [];
  for (const [, { cat, posts: groupPosts }] of groups) {
    const cards = groupPosts.slice(0, 4).map((p) => {
      const art = cardCover(ctx, p);
      const url = ctx.url(p.url);
      const pCat = p.categories?.[0];
      return `<li class="home-card">
        ${art}
        <div class="home-card__body">
          ${pCat ? `<p class="eyebrow"><a class="eyebrow-theme" style="--tc:${escapeHtml(pCat.color)}" href="${ctx.url(`/categorias/${pCat.slug}/`)}">${escapeHtml(pCat.name)}</a></p>` : ""}
          <h3 class="home-card__title"><a href="${url}">${escapeHtml(p.title)}</a></h3>
          ${p.summary ? `<p class="home-card__excerpt">${escapeHtml(p.summary)}</p>` : ""}
          ${p.readingTime ? `<p class="home-card__meta">${p.readingTime} min de leitura</p>` : ""}
        </div>
      </li>`;
    }).join("\n        ");

    sections.push(`<section class="home-section wrap">
      <div class="home-section__head">
        <h2 class="home-section__title" style="--tc:${escapeHtml(cat.color)}">${escapeHtml(cat.name)}</h2>
        <a class="u-arrow" href="${ctx.url(`/categorias/${cat.slug}/`)}">ver todos</a>
      </div>
      <ul class="home-grid">
        ${cards}
      </ul>
    </section>`);
  }

  return `${heroHtml}
${sections.join("\n")}`;
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
