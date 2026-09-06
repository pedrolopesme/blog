// Widget exclusivo deste post: um gráfico de barras minúsculo, sem dependências.
// Demonstra como um post pode carregar JavaScript próprio, co-localizado ao lado
// do texto, para visualizações que não se repetem em nenhum outro lugar.

(function () {
  const el = document.getElementById("grafico-demo");
  if (!el) return;

  const data = [
    { label: "seg", value: 120 },
    { label: "ter", value: 200 },
    { label: "qua", value: 90 },
    { label: "qui", value: 240 },
    { label: "sex", value: 160 },
    { label: "sáb", value: 60 },
    { label: "dom", value: 30 },
  ];
  const max = Math.max(...data.map((d) => d.value));

  for (const d of data) {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = "4px";
    bar.innerHTML =
      `<span>${d.value}</span><small>${d.label}</small>`;
    el.appendChild(bar);
    // Animate in after layout.
    requestAnimationFrame(() => {
      bar.style.height = Math.round((d.value / max) * 100) + "%";
    });
  }
})();
