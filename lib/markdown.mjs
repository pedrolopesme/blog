// Markdown → HTML pipeline.
//
// Design goals:
//  - Raw HTML is allowed inside posts (html: true). This is what gives every
//    post the freedom to drop in bespoke widgets, charts, <style>/<script>,
//    or fully custom markup while still writing prose in Markdown.
//  - markdown-it-attrs lets you attach classes/attributes to any element,
//    e.g.  > A quote {.pullquote}  or  ![alt](img){.wide}  — the basis of the
//    reusable component system (see styles/main.css and docs in the README).
//  - Headings get stable slug ids + anchor links for deep-linking.
//  - Code blocks are highlighted at build time with highlight.js.

import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import attrs from "markdown-it-attrs";
import hljs from "highlight.js";
import { slugify } from "./util.mjs";

export function createMarkdown() {
  const md = new MarkdownIt({
    html: true,        // allow raw HTML blocks/inline in posts
    linkify: true,     // autolink bare URLs
    typographer: true, // smart quotes, dashes, ellipses
    breaks: false,
  });

  // Fenced code blocks. Rendered via the `fence` rule (not the `highlight`
  // option) because markdown-it only uses a highlighter's output verbatim
  // when it starts with `<pre`; a <figure> wrapper would otherwise get
  // nested inside markdown-it's own <pre><code>.
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    const code = token.content;
    const info = (token.info || "").trim().split(/\s+/)[0];
    const language = info && hljs.getLanguage(info) ? info : null;

    let body;
    try {
      body = language
        ? hljs.highlight(code, { language, ignoreIllegals: true }).value
        : hljs.highlightAuto(code).value;
    } catch {
      body = md.utils.escapeHtml(code);
    }

    const cls = "hljs" + (language ? ` language-${language}` : "");
    const lineCount = code.replace(/\n$/, "").split("\n").length;
    const gutter = Array.from({ length: lineCount }, (_, i) =>
      String(i + 1).padStart(2, "0"),
    ).join("\n");

    return `<figure class="code-block">` +
      `<div class="code-block__bar">` +
        `<span class="code-block__lang">${md.utils.escapeHtml(language || "texto")}</span>` +
        `<button class="code-block__copy" type="button">Copiar</button>` +
      `</div>` +
      `<div class="code-block__body">` +
        `<pre class="code-block__lines" aria-hidden="true">${gutter}</pre>` +
        `<pre class="${cls}"><code>${body}</code></pre>` +
      `</div>` +
    `</figure>\n`;
  };

  md.use(attrs, {
    allowedAttributes: ["id", "class", "style", "target", "rel", /^data-.*$/],
  });

  md.use(anchor, {
    slugify: (s) => slugify(s),
    permalink: anchor.permalink.linkInsideHeader({
      symbol: "#",
      class: "heading-anchor",
      placement: "after",
      ariaHidden: true,
    }),
  });

  // Open external links in a new tab, politely.
  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx].attrGet("href") || "";
    if (/^https?:\/\//i.test(href)) {
      tokens[idx].attrSet("target", "_blank");
      tokens[idx].attrSet("rel", "noopener noreferrer");
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  // Wrap tables so they can scroll on narrow screens and carry a framed look.
  md.renderer.rules.table_open = () => '<div class="prose-table">\n<table>\n';
  md.renderer.rules.table_close = () => "</table>\n</div>\n";

  return md;
}

/** Render a Markdown string to HTML using a fresh-enough shared instance. */
export function renderMarkdown(md, source) {
  return md.render(source || "");
}
