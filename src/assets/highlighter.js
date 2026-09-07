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

  // Show recolor/remove toolbar on hover (desktop) and tap (mobile).
  prose.addEventListener("mouseover", (e) => {
    const m = e.target.closest && e.target.closest("mark.hl");
    if (m) showToolbar(m.dataset.hlId);
  });
  prose.addEventListener("mouseout", (e) => {
    const m = e.target.closest && e.target.closest("mark.hl");
    if (m) scheduleHide();
  });
  prose.addEventListener("click", (e) => {
    const m = e.target.closest && e.target.closest("mark.hl");
    const sel = window.getSelection();
    if (m && (!sel || sel.isCollapsed)) {
      clearTimeout(hideTimer);
      showToolbar(m.dataset.hlId);
    }
  });
  document.addEventListener("pointerdown", (e) => {
    if (toolbar && toolbar.classList.contains("is-open")) {
      if (!toolbar.contains(e.target) && !(e.target.closest && e.target.closest("mark.hl"))) {
        hideToolbar();
      }
    }
  });

  // --- capture new selections (touch + mouse) via a confirm button ---------
  let pending = null;
  let addBtn = null;
  let selTimer = null;

  function buildAddBtn() {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "hl-add";
    b.textContent = "Marcar";
    b.addEventListener("pointerdown", (e) => e.preventDefault()); // keep selection
    b.addEventListener("click", () => {
      if (!pending) return;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const hls = load();
      hls.push({ id: id, start: pending.start, end: pending.end, color: DEFAULT });
      save(hls);
      wrapRange(prose, pending.start, pending.end, DEFAULT, id);
      pending = null;
      hideAddBtn();
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    });
    document.body.appendChild(b);
    return b;
  }
  function showAddBtn(range) {
    if (!addBtn) addBtn = buildAddBtn();
    addBtn.classList.add("is-open");
    const rect = range.getBoundingClientRect();
    const bb = addBtn.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - bb.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - bb.width - 8));
    let top = rect.top - bb.height - 10;
    if (top < 8) top = rect.bottom + 10;
    addBtn.style.left = left + "px";
    addBtn.style.top = top + "px";
  }
  function hideAddBtn() {
    if (addBtn) addBtn.classList.remove("is-open");
  }

  function evalSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      pending = null;
      hideAddBtn();
      return;
    }
    const range = sel.getRangeAt(0);
    if (!prose.contains(range.commonAncestorContainer)) {
      pending = null;
      hideAddBtn();
      return;
    }
    const start = charOffset(prose, range.startContainer, range.startOffset);
    const end = charOffset(prose, range.endContainer, range.endOffset);
    if (start < 0 || end < 0 || end <= start) {
      pending = null;
      hideAddBtn();
      return;
    }
    pending = { start: start, end: end };
    showAddBtn(range);
  }
  document.addEventListener("selectionchange", () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(evalSelection, 180);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (activeId) hideToolbar();
      if (addBtn && addBtn.classList.contains("is-open") && pending) {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.rangeCount) {
          showAddBtn(sel.getRangeAt(0));
        } else {
          hideAddBtn();
        }
      }
    },
    { passive: true }
  );

  renderAll();
})();
