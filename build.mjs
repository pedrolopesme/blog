// Static site generator.
//
// Reads editorial content from src/content, renders it through the template
// layer, and writes a fully static site to dist/. No client framework, no
// runtime — just files GitHub Pages can serve.
//
// Content model
// -------------
//   src/content/home.md          -> intro prose on the home page
//   src/content/posts/<slug>/     -> a post as a directory (recommended)
//         index.md   OR  index.html   (front-matter + body)
//         *.css *.js *.png ...         (co-located assets, copied verbatim)
//   src/content/posts/<name>.md   -> a post as a single file (also supported)
//   src/content/pages/<slug>.md   -> standalone pages (e.g. sobre)
//
// A post may be Markdown or raw HTML. Either way it may contain arbitrary
// HTML, <style>, <script> and per-post assets — that is the "total freedom
// per post" requirement. Front-matter `styles`/`scripts`/`head`/`theme` wire
// bespoke widgets into a single page without touching the global design.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

import site from "./site.config.js";
import { createMarkdown } from "./lib/markdown.mjs";
import {
  makeContext,
  layout,
  articleMain,
  homeMain,
  listMain,
  categoriesIndexMain,
  pageMain,
} from "./lib/templates.mjs";
import {
  slugify,
  escapeHtml,
  withBase,
  absoluteUrl,
  toDate,
  rfc822,
  readingTime,
  excerptFromHtml,
  themeColor,
} from "./lib/util.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const CONTENT = path.join(SRC, "content");
const OUT = path.join(ROOT, "dist");

const INCLUDE_DRAFTS = /^(1|true|yes)$/i.test(process.env.INCLUDE_DRAFTS || "");

const md = createMarkdown();
const ctx = makeContext(site);

async function main() {
  const t0 = Date.now();
  await rmrf(OUT);
  await fs.mkdir(OUT, { recursive: true });

  await copyStaticAssets();

  const posts = await loadPosts();
  const pages = await loadPages();
  const categories = collectCategories(posts);

  await renderPosts(posts);
  await renderPages(pages);
  await renderHome(posts);
  await renderPostsIndex(posts);
  await renderCategories(categories, posts);
  await renderFeed(posts);
  await renderSitemap(posts, pages, categories);
  await render404();

  const secs = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(
    `✓ built ${posts.length} post(s), ${pages.length} page(s), ` +
      `${categories.length} theme(s) → dist/ in ${secs}s`,
  );
  if (site.baseUrl !== "/") console.log(`  base path: ${site.baseUrl}`);
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

async function copyStaticAssets() {
  // Global stylesheet(s).
  await copyDir(path.join(SRC, "styles"), path.join(OUT, "assets", "styles"));
  // Global assets (site-wide images, fonts, favicons...).
  await copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"));
}

// ---------------------------------------------------------------------------
// Loading content
// ---------------------------------------------------------------------------

async function loadPosts() {
  const dir = path.join(CONTENT, "posts");
  if (!(await exists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

    let source, srcFile, postDir;
    if (entry.isDirectory()) {
      postDir = path.join(dir, entry.name);
      srcFile = await firstExisting(postDir, ["index.md", "index.html"]);
      if (!srcFile) continue;
    } else if (/\.(md|markdown|html)$/i.test(entry.name)) {
      srcFile = path.join(dir, entry.name);
      postDir = null;
    } else {
      continue;
    }

    source = await fs.readFile(srcFile, "utf8");
    const isHtml = /\.html?$/i.test(srcFile);
    const { data, content } = matter(source);

    if (data.draft && !INCLUDE_DRAFTS) continue;

    const baseName = entry.isDirectory()
      ? entry.name
      : entry.name.replace(/\.[^.]+$/, "");
    const slug = slugify(data.slug || baseName);
    const html = isHtml ? content : md.render(content);

    const categories = normalizeCategories(data.categories || data.category);
    const summary = data.summary || data.description || excerptFromHtml(html);

    posts.push({
      slug,
      srcFile,
      postDir, // directory to copy co-located assets from (or null)
      title: data.title || baseName,
      date: data.date || null,
      dateObj: toDate(data.date),
      summary,
      categories,
      cover: data.cover || null,
      coverAlt: data.coverAlt || data.cover_alt || "",
      coverCaption: data.coverCaption || data.cover_caption || "",
      styles: toArray(data.styles),
      scripts: toArray(data.scripts),
      rawHead: data.head || "",
      theme: data.theme || "",
      ogImage: data.ogImage || data.og_image || null,
      html,
      readingTime: readingTime(html),
      url: `/posts/${slug}/`,
    });
  }

  posts.sort((a, b) => {
    const ta = a.dateObj ? a.dateObj.getTime() : 0;
    const tb = b.dateObj ? b.dateObj.getTime() : 0;
    return tb - ta;
  });
  return posts;
}

async function loadPages() {
  const dir = path.join(CONTENT, "pages");
  if (!(await exists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const pages = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.(md|markdown|html)$/i.test(entry.name)) continue;
    const srcFile = path.join(dir, entry.name);
    const source = await fs.readFile(srcFile, "utf8");
    const isHtml = /\.html?$/i.test(entry.name);
    const { data, content } = matter(source);
    const baseName = entry.name.replace(/\.[^.]+$/, "");
    const slug = slugify(data.slug || baseName);
    const html = isHtml ? content : md.render(content);
    pages.push({
      slug,
      title: data.title || baseName,
      summary: data.summary || data.description || "",
      styles: toArray(data.styles),
      scripts: toArray(data.scripts),
      rawHead: data.head || "",
      theme: data.theme || "",
      html,
      url: `/${slug}/`,
    });
  }
  return pages;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function normalizeCategories(value) {
  return toArray(value).map((name) => {
    const clean = String(name).trim();
    return {
      name: clean,
      slug: slugify(clean),
      color: themeColor(clean, site.themeColors, site.themePalette),
    };
  });
}

function collectCategories(posts) {
  const map = new Map();
  for (const post of posts) {
    for (const cat of post.categories) {
      if (!map.has(cat.slug)) map.set(cat.slug, { ...cat, count: 0, posts: [] });
      const rec = map.get(cat.slug);
      rec.count += 1;
      rec.posts.push(post);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Build the per-page <head> extras from styles/scripts/rawHead. */
function extraHead({ styles = [], scripts = [], rawHead = "" }) {
  const s = styles
    .map((href) => `  <link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join("\n");
  const j = scripts
    .map((src) => `  <script src="${escapeHtml(src)}" defer></script>`)
    .join("\n");
  return [s, j, rawHead].filter(Boolean).join("\n");
}

function bodyClass(base, theme) {
  return [base, theme ? `theme-${slugify(theme)}` : ""].filter(Boolean).join(" ");
}

function relatedPosts(post, all, n = 3) {
  const slugs = new Set(post.categories.map((c) => c.slug));
  const others = all.filter((p) => p.slug !== post.slug);
  const sameTheme = others.filter((p) =>
    p.categories.some((c) => slugs.has(c.slug)),
  );
  const picked = [...sameTheme];
  for (const p of others) {
    if (picked.length >= n) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked.slice(0, n);
}

async function renderPosts(posts) {
  for (const post of posts) {
    const outDir = path.join(OUT, "posts", post.slug);
    if (post.postDir) await copyPostAssets(post.postDir, outDir);
    const related = relatedPosts(post, posts);
    const html = layout(ctx, {
      title: post.title,
      description: post.summary,
      bodyClass: bodyClass("is-post", post.theme),
      head: extraHead(post),
      canonicalPath: post.url,
      ogImage: post.ogImage ? withBase(site.baseUrl, post.ogImage) : undefined,
      main: articleMain(ctx, post, related),
    });
    await writeFile(path.join(outDir, "index.html"), html);
  }
}

async function renderPages(pages) {
  for (const page of pages) {
    const html = layout(ctx, {
      title: page.title,
      description: page.summary || site.description,
      bodyClass: bodyClass("is-page", page.theme),
      head: extraHead(page),
      canonicalPath: page.url,
      main: pageMain(ctx, page),
    });
    await writeFile(path.join(OUT, page.slug, "index.html"), html);
  }
}

async function renderHome(posts) {
  const html = layout(ctx, {
    title: "",
    bodyClass: "is-home",
    canonicalPath: "/",
    main: homeMain(ctx, { posts }),
  });
  await writeFile(path.join(OUT, "index.html"), html);
}

async function renderPostsIndex(posts) {
  const html = layout(ctx, {
    title: "Escritos",
    bodyClass: "is-list",
    canonicalPath: "/posts/",
    main: listMain(ctx, {
      title: "Escritos",
      lead: "Tudo o que já publiquei, do mais recente ao mais antigo.",
      posts,
    }),
  });
  await writeFile(path.join(OUT, "posts", "index.html"), html);
}

async function renderCategories(categories, _posts) {
  // Index of themes.
  const indexHtml = layout(ctx, {
    title: "Temas",
    bodyClass: "is-list",
    canonicalPath: "/categorias/",
    main: categoriesIndexMain(ctx, { categories }),
  });
  await writeFile(path.join(OUT, "categorias", "index.html"), indexHtml);

  // One page per theme.
  for (const cat of categories) {
    const html = layout(ctx, {
      title: cat.name,
      bodyClass: bodyClass("is-list", cat.name),
      canonicalPath: `/categorias/${cat.slug}/`,
      main: listMain(ctx, {
        title: cat.name,
        lead: `Escritos sob o tema “${cat.name}”.`,
        posts: cat.posts,
        accent: cat.color,
      }),
    });
    await writeFile(
      path.join(OUT, "categorias", cat.slug, "index.html"),
      html,
    );
  }
}

async function renderFeed(posts) {
  const items = posts
    .slice(0, 20)
    .map((post) => {
      const link = absoluteUrl(site.siteUrl, site.baseUrl, post.url);
      return `    <item>
      <title>${escapeHtml(post.title)}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="true">${escapeHtml(link)}</guid>
      ${post.date ? `<pubDate>${rfc822(post.date)}</pubDate>` : ""}
      <description>${escapeHtml(post.summary)}</description>
    </item>`;
    })
    .join("\n");
  const self = absoluteUrl(site.siteUrl, site.baseUrl, "/feed.xml");
  const home = absoluteUrl(site.siteUrl, site.baseUrl, "/");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(site.title)}</title>
    <link>${escapeHtml(home)}</link>
    <atom:link href="${escapeHtml(self)}" rel="self" type="application/rss+xml" />
    <description>${escapeHtml(site.description)}</description>
    <language>${escapeHtml(site.language)}</language>
${items}
  </channel>
</rss>
`;
  await writeFile(path.join(OUT, "feed.xml"), xml);
}

async function renderSitemap(posts, pages, categories) {
  const urls = [
    "/",
    "/posts/",
    "/categorias/",
    ...pages.map((p) => p.url),
    ...posts.map((p) => p.url),
    ...categories.map((c) => `/categorias/${c.slug}/`),
  ];
  const body = urls
    .map((u) => {
      const loc = absoluteUrl(site.siteUrl, site.baseUrl, u);
      return `  <url><loc>${escapeHtml(loc)}</loc></url>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  await writeFile(path.join(OUT, "sitemap.xml"), xml);
}

async function render404() {
  const html = layout(ctx, {
    title: "Página não encontrada",
    bodyClass: "is-404",
    canonicalPath: "/404.html",
    main: `    <section class="page-head wrap" style="text-align:center">
      <h1 class="page-title">Perdido nas margens</h1>
      <p class="page-lead">Esta página não existe (ou já não existe mais).</p>
      <p><a class="back-link" href="${ctx.url("/")}">← voltar ao início</a></p>
    </section>`,
  });
  await writeFile(path.join(OUT, "404.html"), html);
}

// ---------------------------------------------------------------------------
// FS helpers
// ---------------------------------------------------------------------------

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v.filter(Boolean) : [v].filter(Boolean);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function firstExisting(dir, names) {
  for (const name of names) {
    const p = path.join(dir, name);
    if (await exists(p)) return p;
  }
  return null;
}

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function writeFile(file, contents) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents, "utf8");
}

async function copyDir(from, to) {
  if (!(await exists(from))) return;
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dst);
    else await fs.copyFile(src, dst);
  }
}

/** Copy a post's co-located assets, skipping the source index files. */
async function copyPostAssets(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    if (/^index\.(md|markdown|html)$/i.test(entry.name)) continue;
    if (entry.name.startsWith("_")) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dst);
    else await fs.copyFile(src, dst);
  }
}

main().catch((err) => {
  console.error("✗ build failed:", err);
  process.exit(1);
});
