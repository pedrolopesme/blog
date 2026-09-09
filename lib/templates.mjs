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
  <script>(function(){try{var d=document.documentElement,s=window.localStorage;d.dataset.theme=s.getItem("theme")||"light";var sc=s.getItem("readScale");if(sc)d.style.setProperty("--reading-scale",sc);}catch(e){}})();</script>
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
  <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500;1,6..72,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
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
  <script src="${ctx.asset("highlighter.js")}" defer></script>
  <script src="${ctx.asset("reading-progress.js")}" defer></script>
  <script src="${ctx.asset("reader-prefs.js")}" defer></script>
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
      <button class="site-header__toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="site-nav">
        <span class="site-header__burger" aria-hidden="true"></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="Navegação principal">
        <ul>
        ${links}
        </ul>
        <div class="site-tools">
          <button type="button" class="tool tool--type" aria-label="Ajustar tipografia" title="Tipografia"><span class="tool__aa">Aa</span></button>
          <button type="button" class="tool tool--theme" aria-label="Alternar tema claro/escuro" title="Tema">
            <svg class="tool__moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"/></svg>
            <svg class="tool__sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.1"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>
          </button>
        </div>
      </nav>
    </div>
    <script>(function(){var h=document.currentScript.parentNode,b=h.querySelector(".site-header__toggle"),n=h.querySelector(".site-nav");if(!b)return;b.addEventListener("click",function(){var o=h.classList.toggle("nav-open");b.setAttribute("aria-expanded",o?"true":"false");b.setAttribute("aria-label",o?"Fechar menu":"Abrir menu");});n.addEventListener("click",function(e){if(e.target.closest("a")){h.classList.remove("nav-open");b.setAttribute("aria-expanded","false");b.setAttribute("aria-label","Abrir menu");}});})();</script>
  </header>`;
}

function siteFooter(ctx) {
  const { site } = ctx;
  const year = new Date().getFullYear();

  const navLinks = site.nav
    .map((item) => `<a href="${ctx.url(item.href)}">${escapeHtml(item.label)}</a>`)
    .join("\n          ");

  const socialLinks = site.social
    .map((item) => `<a href="${ctx.url(item.href)}">${escapeHtml(item.label)}</a>`)
    .join("\n          ");

  const cats = (ctx.categories || [])
    .slice(0, 8)
    .map((c) => `<a href="${ctx.url(`/categorias/${c.slug}/`)}">${escapeHtml(c.name)}</a>`)
    .join("\n          ");

  return `<footer class="site-footer">
    <div class="wrap site-footer__top">
      <div class="site-footer__brand-col">
        <a class="site-footer__brand" href="${ctx.url("/")}">
          <img class="site-footer__logo" src="${ctx.asset("logo.png")}" alt="${escapeHtml(site.title)}" width="36" height="36" />
          <span class="site-footer__title">Blog</span>
        </a>
        <p class="site-footer__desc">${escapeHtml(site.description)}</p>
      </div>
      <nav class="site-footer__col" aria-label="Categorias">
        <p class="eyebrow-label">Temas</p>
        ${cats}
      </nav>
      <nav class="site-footer__col" aria-label="Navegação">
        <p class="eyebrow-label">Navegação</p>
        ${navLinks}
      </nav>
      <nav class="site-footer__col" aria-label="Contato">
        <p class="eyebrow-label">Contato</p>
        ${socialLinks}
        ${site.author.email ? `<a href="mailto:${escapeHtml(site.author.email)}">Email</a>` : ""}
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

export function articleMain(ctx, post, related = [], prev = null, next = null, quote = null) {
  const metaParts = [
    `<span class="post-byline">${escapeHtml(ctx.site.author.name)}</span>`,
  ];
  if (post.date) {
    metaParts.push(
      `<time datetime="${isoDate(post.date)}">${formatDate(post.date)}</time>`,
    );
  }
  if (post.readingTime) {
    metaParts.push(`<span>${post.readingTime} min</span>`);
  }
  const metaHtml = metaParts.join('<span class="eyebrow-sep" aria-hidden="true">·</span>');

  // Share links (absolute URL for social targets) — icons only
  const postAbs = encodeURI(`${(ctx.site.siteUrl || "").replace(/\/$/, "")}${ctx.url(post.url)}`);
  const postTitle = encodeURIComponent(post.title);
  const shareLinks = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${postAbs}`, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z"/></svg>' },
    { label: "X", href: `https://x.com/intent/tweet?url=${postAbs}&text=${postTitle}`, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/></svg>' },
    { label: "WhatsApp", href: `https://wa.me/?text=${postTitle}%20${postAbs}`, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>' },
  ].map((s) => `<a href="${escapeHtml(s.href)}" target="_blank" rel="noopener" class="post-share__link" title="${escapeHtml(s.label)}" aria-label="Compartilhar no ${escapeHtml(s.label)}">${s.icon}</a>`).join("");

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
        <h1 class="post-cover__title">${escapeHtml(post.title)}</h1>
        ${themeLabel ? `<p class="eyebrow eyebrow--center post-cover__cat">${themeLabel}</p>` : ""}
      </div>
    </figure>`;
  } else {
    cover = "";
  }

  const postIntro = hasCover
    ? `<div class="post-intro wrap">
        <div class="post-meta-bar">
          <p class="post-meta">${metaHtml}</p>
          <div class="post-share" aria-label="Compartilhar">${shareLinks}</div>
        </div>
      </div>`
    : "";

  const continueReading = related.length
    ? `      <section class="continue wrap">
        <div class="continue__head">
          <span class="continue__rule" aria-hidden="true"></span>
          <h2 class="continue__title">Continuar lendo</h2>
          <span class="continue__flourish" aria-hidden="true">❧</span>
          <span class="continue__rule" aria-hidden="true"></span>
        </div>
        <ul class="related-grid">
          ${related.map((p) => {
            const art = cardCover(ctx, p).replace(/^<div class="article-block__art">|<\/div>$/g, "");
            const url = ctx.url(p.url);
            const cat = p.categories?.[0];
            return `<li class="related-card">
            <a href="${url}" class="related-card__link">
              ${art ? `<span class="related-card__img">${art}</span>` : ""}
              <span class="related-card__body">
                ${cat ? `<span class="eyebrow"><span class="eyebrow-theme" style="--tc:${escapeHtml(cat.color)}">${escapeHtml(cat.name)}</span></span>` : ""}
                <span class="related-card__title">${escapeHtml(p.title)}</span>
                ${p.readingTime ? `<span class="related-card__meta">${p.readingTime} min de leitura</span>` : ""}
              </span>
            </a>
          </li>`;}).join("\n          ")}
        </ul>
      </section>`
    : "";

  function postNavCard(p, direction) {
    if (!p) return "";
    const art = p.cover ? cardCover(ctx, p).replace(/^<div class="article-block__art">|<\/div>$/g, "") : "";
    const cat = p.categories?.[0];
    const word = direction === "prev" ? "Anterior" : "Próximo";
    return `<a class="post-nav__item post-nav__item--${direction}" href="${ctx.url(p.url)}" aria-label="${direction === "prev" ? "Post anterior" : "Próximo post"}: ${escapeHtml(p.title)}">
      <span class="post-nav__spine">${word}</span>
      <span class="post-nav__panel">
        ${art ? `<span class="post-nav__img">${art}</span>` : ""}
        <span class="post-nav__info">
          <span class="post-nav__label">${word}</span>
          <span class="post-nav__title">${escapeHtml(p.title)}</span>
          ${cat ? `<span class="post-nav__cat" style="--tc:${escapeHtml(cat.color)}">${escapeHtml(cat.name)}</span>` : ""}
        </span>
      </span>
    </a>`;
  }

  const postNav = (prev || next)
    ? `<nav class="post-nav" aria-label="Navegação entre posts">
      ${postNavCard(prev, "prev")}
      ${postNavCard(next, "next")}
    </nav>
    <script>(function(){var b=document.body,c=document.querySelector(".post-cover")||document.querySelector(".post-header"),th=function(){if(c){var r=c.getBoundingClientRect();return Math.max(120,r.height*0.6);}return 160;},t=function(){if(window.scrollY>th()){b.classList.add("nav-visible");}else{b.classList.remove("nav-visible");}};window.addEventListener("scroll",t,{passive:true});window.addEventListener("resize",t,{passive:true});t();})();</script>`
    : "";

  return `${cover}
    ${postIntro}
    <header class="post-header wrap"${hasCover ? " hidden" : ""}>
      ${themeLabel ? `<p class="eyebrow eyebrow--center">${themeLabel}</p>` : ""}
      <h1 class="post-title">${escapeHtml(post.title)}</h1>
      <p class="post-meta">${metaHtml}</p>
    </header>
    <article class="post wrap" data-reading="${post.readingTime || 0}"${accent ? ` style="--tc:${escapeHtml(accent)}"` : ""}>
      <div class="prose">
${post.html}
      </div>
      <div class="post-end" aria-hidden="true">
        <span class="post-end__flourish">❧</span>
      </div>
      ${quote ? `<aside class="post-quote">
        <blockquote class="post-quote__text">${escapeHtml(quote.quote)}</blockquote>
        <footer class="post-quote__source">
          <cite class="post-quote__character">${escapeHtml(quote.character)}</cite>
          ${quote.context ? `<p class="post-quote__context">${escapeHtml(quote.context)}</p>` : ""}
          <p class="post-quote__book">${escapeHtml(quote.book)} · ${escapeHtml(quote.author)}</p>
        </footer>
      </aside>` : ""}
    </article>
${postNav}
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

  // Build hero (featured)
  const heroHtml = `<section class="home-hero wrap">
    <div class="home-hero__media">
      <p class="home-hero__flag">Em destaque</p>
      ${heroArt ? `<a class="home-hero__art" href="${heroUrl}">
        ${heroArt.replace(/^<div class="article-block__art">|<\/div>$/g, "")}
      </a>` : ""}
    </div>
    <div class="home-hero__body">
      ${heroCat ? `<p class="eyebrow"><a class="eyebrow-theme" style="--tc:${escapeHtml(heroCat.color)}" href="${ctx.url(`/categorias/${heroCat.slug}/`)}">${escapeHtml(heroCat.name)}</a></p>` : ""}
      <h2 class="home-hero__title"><a href="${heroUrl}">${escapeHtml(hero.title)}</a></h2>
      ${hero.summary ? `<p class="home-hero__excerpt">${escapeHtml(hero.summary)}</p>` : ""}
      ${hero.readingTime ? `<p class="home-hero__meta">${hero.readingTime} min de leitura</p>` : ""}
      <a class="u-arrow home-hero__link" href="${heroUrl}">ler o ensaio</a>
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
  for (const idx of [...groups.keys()].map((_, i) => i)) {
    const { cat, posts: groupPosts } = [...groups.values()][idx];
    const kicker = (ctx.site.themeKickers || {})[cat.name] || "";

    const cards = groupPosts.slice(0, 3).map((p) => {
      const art = cardCover(ctx, p).replace(/^<div class="article-block__art">|<\/div>$/g, "");
      const url = ctx.url(p.url);
      const pCat = p.categories?.[0];
      return `<article class="home-card">
        <a class="home-card__art-link" href="${url}">
          ${art}
        </a>
        <div class="home-card__body">
          <div class="home-card__meta-row">
            <span class="home-card__cat">${escapeHtml(pCat?.name || "")}</span>
            ${p.readingTime ? `<span>${p.readingTime} min</span>` : ""}
          </div>
          <h3 class="home-card__title"><a href="${url}">${escapeHtml(p.title)}</a></h3>
          ${p.summary ? `<p class="home-card__excerpt">${escapeHtml(p.summary)}</p>` : ""}
        </div>
        <a class="home-card__read" href="${url}">Ler artigo →</a>
      </article>`;
    }).join("\n        ");

    sections.push(`<section class="home-section wrap">
      <div class="home-section__head">
        <div class="home-section__head-left">
          <h2 class="home-section__title">${escapeHtml(cat.name)}</h2>
          ${kicker ? `<span class="home-section__kicker">${escapeHtml(kicker)}</span>` : ""}
        </div>
        <a class="home-section__link" href="${ctx.url(`/categorias/${cat.slug}/`)}">Ver todos<span class="home-section__arrow" aria-hidden="true">→</span></a>
      </div>
      <div class="home-grid">
        ${cards}
      </div>
    </section>`);
  }

  const divider = `<div class="home-divider wrap" aria-hidden="true"><span class="home-divider__rule"></span><span class="home-divider__glyph">§ § §</span><span class="home-divider__rule"></span></div>`;

  return `${heroHtml}
${divider}
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
  const social = page.social
    ? `<ul class="about-social">
          ${page.social
            .map(
              (s) =>
                `<li><a href="${escapeHtml(s.href)}"${/^https?:/i.test(s.href) ? ' target="_blank" rel="me noopener"' : ""}>${escapeHtml(s.label)}</a></li>`,
            )
            .join("\n          ")}
        </ul>`
    : "";
  if (page.photo) {
    return `    <article class="page page--about wrap">
      <header class="about-hero">
        <img class="about-hero__photo" src="${ctx.asset(page.photo)}" alt="${escapeHtml(page.photoAlt)}" width="220" height="220" />
        <div class="about-hero__intro">
          <h1 class="page-title">${escapeHtml(page.title)}</h1>
          ${page.summary ? `<p class="page-lead">${escapeHtml(page.summary)}</p>` : ""}
          ${social}
        </div>
      </header>
      <div class="prose">
${page.html}
      </div>
    </article>`;
  }
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
