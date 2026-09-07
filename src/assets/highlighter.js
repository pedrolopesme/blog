/* Kindle-style text highlighter for post bodies.
   - Select text in .prose -> yellow highlight.
   - Persisted in localStorage per post (key = pathname).
   - Re-rendered on load. Hover a highlight to recolor or remove. */
(function () {
  "use strict";

  const prose = document.querySelector(".is-post .prose");
  if (!prose) return;

  const KEY = "hl:" + location.pathname;
  const COLORS = ["yellow", "pink", "blue", "green"];
  const DEFAULT = "yellow";

  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (_) {
      return [];
    }
  }
  function save(hls) {
    try {
      localStorage.setItem(KEY, JSON.stringify(hls));
    } catch (_) {}
  }

  // --- offset helpers -------------------------------------------------------
  function textNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const out = [];
    let n;
    while ((n = walker.nextNode())) out.push(n);
    return out;
  }

  // Character offset of a boundary (container, offset) relative to root start.
  function charOffset(root, container, offset) {
    const r = document.createRange();
    r.setStart(root, 0);
    try {
      r.setEnd(container, offset);
    } catch (_) {
      return -1;
    }
    return r.toString().length;
  }

  // Wrap [start,end) of root's text in <mark> segments sharing an id/color.
  function wrapRange(root, start, end, color, id) {
    const nodes = textNodes(root);
    let pos = 0;
    const segs = [];
    for (const node of nodes) {
      const len = node.nodeValue.length;
      const ns = pos;
      const ne = pos + len;
      pos = ne;
      if (ne <= start || ns >= end) continue;
      if (node.parentNode && node.parentNode.nodeName === "MARK") continue;
      segs.push({
        node: node,
        s: Math.max(start, ns) - ns,
        e: Math.min(end, ne) - ns,
      });
    }
    for (const seg of segs) {
      if (seg.e <= seg.s) continue;
      const r = document.createRange();
      try {
        r.setStart(seg.node, seg.s);
        r.setEnd(seg.node, seg.e);
        const mark = document.createElement("mark");
        mark.className = "hl";
        mark.dataset.hlId = id;
        mark.dataset.color = color;
        r.surroundContents(mark);
      } catch (_) {}
    }
  }

  function renderAll() {
    const hls = load();
    for (const h of hls) wrapRange(prose, h.start, h.end, h.color || DEFAULT, h.id);
  }

  function recolor(id, color) {
    prose
      .querySelectorAll('mark.hl[data-hl-id="' + id + '"]')
      .forEach((m) => (m.dataset.color = color));
    const hls = load();
    for (const h of hls) if (h.id === id) h.color = color;
    save(hls);
  }

  function remove(id) {
    prose.querySelectorAll('mark.hl[data-hl-id="' + id + '"]').forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
    save(load().filter((h) => h.id !== id));
  }

  // --- toolbar --------------------------------------------------------------
  let toolbar = null;
  let hideTimer = null;
  let activeId = null;

  function buildToolbar() {
    const bar = document.createElement("div");
    bar.className = "hl-toolbar";
    bar.setAttribute("role", "toolbar");
    for (const c of COLORS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "hl-swatch hl-swatch--" + c;
      b.dataset.color = c;
      b.setAttribute("aria-label", "Marcar em " + c);
      b.addEventListener("click", () => {
        if (activeId) recolor(activeId, c);
      });
      bar.appendChild(b);
    }
    const del = document.createElement("button");
    del.type = "button";
    del.className = "hl-remove";
    del.setAttribute("aria-label", "Remover marcação");
    del.textContent = "\u2715";
    del.addEventListener("click", () => {
      if (activeId) remove(activeId);
      hideToolbar();
    });
    bar.appendChild(del);
    bar.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    bar.addEventListener("mouseleave", scheduleHide);
    document.body.appendChild(bar);
    return bar;
  }

  function showToolbar(id) {
    if (!toolbar) toolbar = buildToolbar();
    activeId = id;
    clearTimeout(hideTimer);
    const marks = prose.querySelectorAll('mark.hl[data-hl-id="' + id + '"]');
    if (!marks.length) return;
    const rect = marks[0].getBoundingClientRect();
    toolbar.classList.add("is-open");
    const tb = toolbar.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tb.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tb.width - 8));
    let top = rect.top - tb.height - 8;
    if (top < 8) top = rect.bottom + 8;
    toolbar.style.left = left + "px";
    toolbar.style.top = top + "px";
  }

  function hideToolbar() {
    if (toolbar) toolbar.classList.remove("is-open");
    activeId = null;
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideToolbar, 260);
  }

  prose.addEventListener("mouseover", (e) => {
    const m = e.target.closest && e.target.closest("mark.hl");
    if (m) showToolbar(m.dataset.hlId);
  });
  prose.addEventListener("mouseout", (e) => {
    const m = e.target.closest && e.target.closest("mark.hl");
    if (m) scheduleHide();
  });

  // --- capture new selections ----------------------------------------------
  prose.addEventListener("mouseup", () => {
    // let click-to-recolor on existing marks not create new ones
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!prose.contains(range.commonAncestorContainer)) return;
      const start = charOffset(prose, range.startContainer, range.startOffset);
      const end = charOffset(prose, range.endContainer, range.endOffset);
      if (start < 0 || end < 0 || end <= start) return;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const hls = load();
      hls.push({ id: id, start: start, end: end, color: DEFAULT });
      save(hls);
      wrapRange(prose, start, end, DEFAULT, id);
      sel.removeAllRanges();
    }, 0);
  });

  window.addEventListener("scroll", () => { if (activeId) hideToolbar(); }, { passive: true });

  renderAll();
})();
