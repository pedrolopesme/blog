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
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : null;
      try {
        const out = language
          ? hljs.highlight(code, { language, ignoreIllegals: true }).value
          : hljs.highlightAuto(code).value;
        const cls = "hljs" + (language ? ` language-${language}` : "");
        const label = language
          ? `<span class="code-block__lang">${language}</span>`
          : "";
        return `<figure class="code-block">${label}<pre class="${cls}"><code>${out}</code></pre></figure>`;
      } catch {
        return ""; // fall back to markdown-it's default escaping
      }
    },
  });

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

  return md;
}

/** Render a Markdown string to HTML using a fresh-enough shared instance. */
export function renderMarkdown(md, source) {
  return md.render(source || "");
}
