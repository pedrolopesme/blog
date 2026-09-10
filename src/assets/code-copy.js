/* Copy-to-clipboard for prose code blocks. Delegated, so it costs one
   listener regardless of how many blocks a post has. */
(function () {
  "use strict";

  const LABEL = "Copiar";
  const DONE = "Copiado";
  const FAIL = "Erro";

  /** Copy via a throwaway textarea — works when the async API is denied. */
  function legacyCopy(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".code-block__copy");
    if (!btn) return;

    const block = btn.closest(".code-block");
    // Target the highlighted <pre> only, so the line-number gutter is excluded.
    const code = block && block.querySelector("pre.hljs code");
    if (!code) return;

    const text = code.innerText.replace(/\n$/, "");

    function settle(ok) {
      btn.textContent = ok ? DONE : FAIL;
      btn.dataset.state = ok ? "done" : "fail";
      window.setTimeout(() => {
        btn.textContent = LABEL;
        delete btn.dataset.state;
      }, 1800);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => settle(true),
        // Permission denied or unfocused document: try the legacy path
        // before reporting failure.
        () => settle(legacyCopy(text)),
      );
      return;
    }

    settle(legacyCopy(text));
  });
})();
