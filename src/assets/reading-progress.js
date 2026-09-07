/* Kindle-style reading progress for post pages.
   - Fixed brown bar at the bottom that grows with scroll through the post.
   - Floating meta: minutes remaining (left) and percent read (right). */
(function () {
  "use strict";

  const el =
    document.querySelector(".is-post .post") ||
    document.querySelector(".is-post .prose");
  if (!el) return;

  const total = parseInt(el.dataset.reading || "0", 10) || 0;

  const bar = document.createElement("div");
  bar.className = "reading-bar";
  const fill = document.createElement("div");
  fill.className = "reading-bar__fill";
  bar.appendChild(fill);

  const meta = document.createElement("div");
  meta.className = "reading-meta";
  const left = document.createElement("span");
  left.className = "reading-meta__left";
  const right = document.createElement("span");
  right.className = "reading-meta__right";
  meta.appendChild(left);
  meta.appendChild(right);

  document.body.appendChild(bar);
  document.body.appendChild(meta);

  function update() {
    const rect = el.getBoundingClientRect();
    const start = window.scrollY + rect.top;
    const height = el.offsetHeight || 1;
    const winH = window.innerHeight;
    const raw = (window.scrollY + winH - start) / height; // may exceed 1 past the end
    const p = Math.max(0, Math.min(1, raw));

    fill.style.width = (p * 100).toFixed(2) + "%";
    right.textContent = Math.round(p * 100) + "% lido";
    if (total > 0) {
      const rem = Math.max(0, Math.ceil(total * (1 - p)));
      if (p >= 0.995 || rem === 0) left.textContent = "concluído";
      else left.textContent = rem + (rem === 1 ? " min restante" : " min restantes");
    } else {
      left.textContent = "";
    }

    // Visible while reading; hidden once fully read (>=100%). Reappears when
    // the reader scrolls back up (raw drops below the end again).
    const scrolledIn = window.scrollY > winH * 0.35;
    const done = raw >= 1;
    document.body.classList.toggle("reading-active", scrolledIn && !done);
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
})();
