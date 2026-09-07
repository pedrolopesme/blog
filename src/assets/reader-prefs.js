/* Reader preferences: theme toggle + typography (size & column width). */
(function () {
  "use strict";

  const root = document.documentElement;
  const store = window.localStorage;

  // --- theme ---------------------------------------------------------------
  const themeBtn = document.querySelector(".tool--theme");
  function setTheme(t) {
    root.dataset.theme = t;
    try { store.setItem("theme", t); } catch (_) {}
  }
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  // --- typography ----------------------------------------------------------
  const SCALES = [0.9, 1, 1.1, 1.2, 1.35];
  const MEASURES = { estreito: "34rem", normal: "40rem", largo: "46rem" };

  function currentScale() {
    const v = parseFloat(store.getItem("readScale"));
    return SCALES.indexOf(v) >= 0 ? v : 1;
  }
  function currentMeasure() {
    const v = store.getItem("readMeasure");
    for (const k in MEASURES) if (MEASURES[k] === v) return k;
    return "normal";
  }
  function applyScale(v) {
    root.style.setProperty("--reading-scale", String(v));
    try { store.setItem("readScale", String(v)); } catch (_) {}
  }
  function applyMeasure(key) {
    const v = MEASURES[key] || MEASURES.normal;
    root.style.setProperty("--measure", v);
    try { store.setItem("readMeasure", v); } catch (_) {}
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
      "</div>" +
      '<div class="type-pop__row type-pop__row--width" role="group" aria-label="Largura da coluna">' +
      '<button type="button" class="type-pop__w" data-w="estreito">Estreito</button>' +
      '<button type="button" class="type-pop__w" data-w="normal">Normal</button>' +
      '<button type="button" class="type-pop__w" data-w="largo">Largo</button>' +
      "</div>";
    document.body.appendChild(p);

    p.addEventListener("click", (e) => {
      const act = e.target.getAttribute && e.target.getAttribute("data-act");
      const w = e.target.getAttribute && e.target.getAttribute("data-w");
      if (act) {
        let i = SCALES.indexOf(currentScale());
        if (i < 0) i = 1;
        i = act === "inc" ? Math.min(SCALES.length - 1, i + 1) : Math.max(0, i - 1);
        applyScale(SCALES[i]);
        sync();
      } else if (w) {
        applyMeasure(w);
        sync();
      }
    });
    return p;
  }

  function sync() {
    if (!pop) return;
    const scale = currentScale();
    pop.querySelector('[data-role="size"]').textContent = Math.round(scale * 100) + "%";
    const meas = currentMeasure();
    pop.querySelectorAll(".type-pop__w").forEach((b) => {
      b.classList.toggle("is-active", b.getAttribute("data-w") === meas);
    });
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
