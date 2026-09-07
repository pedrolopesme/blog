/* Reader preferences: theme toggle + typography (size & column width). */
(function () {
  "use strict";

  const root = document.documentElement;
  const store = window.localStorage;

  // --- theme ---------------------------------------------------------------
  const themeBtn = document.querySelector(".tool--theme");
  const reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function applyTheme(t) {
    root.dataset.theme = t;
    try { store.setItem("theme", t); } catch (_) {}
  }
  function setTheme(t) {
    if (reduce) { applyTheme(t); return; }
    if (document.startViewTransition) {
      document.startViewTransition(function () { applyTheme(t); });
    } else {
      root.classList.add("theme-anim");
      applyTheme(t);
      window.setTimeout(function () { root.classList.remove("theme-anim"); }, 550);
    }
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  // --- typography ----------------------------------------------------------
  const SCALES = [0.85, 0.925, 1, 1.075, 1.15, 1.25, 1.35];

  function currentScale() {
    const v = parseFloat(store.getItem("readScale"));
    return SCALES.indexOf(v) >= 0 ? v : 1;
  }
  function applyScale(v) {
    root.style.setProperty("--reading-scale", String(v));
    try { store.setItem("readScale", String(v)); } catch (_) {}
  }

  const typeBtn = document.querySelector(".tool--type");
  let pop = null;

  function buildPopover() {
    const p = document.createElement("div");
    p.className = "type-pop";
    p.innerHTML =
      '<div class="type-pop__row type-pop__row--size">' +
      '<button type="button" class="type-pop__btn" data-act="dec" aria-label="Diminuir fonte">A\u2212</button>' +
      '<span class="type-pop__val" data-role="size">100%</span>' +
      '<button type="button" class="type-pop__btn" data-act="inc" aria-label="Aumentar fonte">A+</button>' +
      "</div>";
    document.body.appendChild(p);

    p.addEventListener("click", (e) => {
      const act = e.target.getAttribute && e.target.getAttribute("data-act");
      if (!act) return;
      let i = SCALES.indexOf(currentScale());
      if (i < 0) i = SCALES.indexOf(1);
      i = act === "inc" ? Math.min(SCALES.length - 1, i + 1) : Math.max(0, i - 1);
      applyScale(SCALES[i]);
      sync();
    });
    return p;
  }

  function sync() {
    if (!pop) return;
    pop.querySelector('[data-role="size"]').textContent =
      Math.round(currentScale() * 100) + "%";
  }

  function positionPopover() {
    if (!pop || !typeBtn) return;
    const r = typeBtn.getBoundingClientRect();
    const pb = pop.getBoundingClientRect();
    let left = r.right - pb.width;
    left = Math.max(8, Math.min(left, window.innerWidth - pb.width - 8));
    let top = r.bottom + 8;
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }

  function togglePopover() {
    if (!pop) pop = buildPopover();
    const open = pop.classList.toggle("is-open");
    if (open) {
      sync();
      positionPopover();
    }
  }

  if (typeBtn) {
    typeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePopover();
    });
    document.addEventListener("click", (e) => {
      if (pop && pop.classList.contains("is-open") &&
          !pop.contains(e.target) && e.target !== typeBtn && !typeBtn.contains(e.target)) {
        pop.classList.remove("is-open");
      }
    });
    window.addEventListener("resize", () => {
      if (pop && pop.classList.contains("is-open")) positionPopover();
    }, { passive: true });
  }
})();
