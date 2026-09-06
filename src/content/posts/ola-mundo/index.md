---
title: "Olá, mundo — e por que este blog existe"
date: 2026-09-05
categories: ["Ensaios", "Bastidores"]
summary: >
  O primeiro escrito destas Margens: o que é este espaço, como ele foi
  construído e como cada post pode ter vida própria — inclusive elementos
  interativos feitos sob medida.
styles: ["style.css"]
scripts: ["grafico.js"]
---

<p class="dropcap">
Todo blog começa com uma promessa silenciosa entre quem escreve e quem lê:
a de que valerá a pena o tempo gasto na leitura. Estas <em>Margens</em> nascem
com essa promessa em mente. Menos vitrine de tecnologia, mais caderno de
anotações; menos ruído, mais tipografia, respiro e cuidado com a palavra.
</p>

A ideia é simples. Escrever sobre tecnologia, desenvolvimento de software e o
ofício de construir coisas — mas escrever para ser lido com calma, do jeito que
se lê um bom ensaio impresso.

> Design não é como uma coisa parece. Design é como ela funciona — e, aqui,
> como ela **se lê**.
{.pullquote}

## Como este espaço é construído

Cada post começa como um arquivo de texto. Escrevo em Markdown quando quero
fluidez, e em HTML puro quando quero controle total do markup. O gerador
transforma tudo em páginas estáticas — sem banco de dados, sem servidor — e
publica no GitHub Pages a cada commit.

Alguns componentes se repetem de post em post. Um destaque, por exemplo:

<aside class="callout callout--note">
  <strong>Nota.</strong> Este bloco é um componente reutilizável. Existe uma
  pequena biblioteca de peças — destaques, citações, figuras, blocos de código —
  descrita no <code>README</code>. Basta escrever a classe certa.
</aside>

E blocos de código já vêm com realce de sintaxe, num tema quente que combina
com o papel:

```js
// O coração do gerador: texto entra, página estática sai.
export function render(markdown) {
  const html = md.render(markdown);   // Markdown → HTML
  return layout({ main: article(html) });
}
```

## Cada post pode ter vida própria

O mais importante: um post não precisa se parecer com os outros. Quando um texto
pede um gráfico, um diagrama ou um widget interativo que não existe em lugar
nenhum, ele pode trazer o seu próprio CSS e o seu próprio JavaScript, guardados
ao lado do texto.

O bloco abaixo é um exemplo disso — um pequeno gráfico desenhado por um script
exclusivo deste post (`grafico.js`), sem nenhuma biblioteca externa:

<figure class="post-widget" aria-label="Gráfico de exemplo específico deste post">
  <div id="grafico-demo" class="chart"></div>
  <figcaption>Linhas de código escritas por dia — um widget que só existe aqui.</figcaption>
</figure>

Isso mantém o melhor dos dois mundos: uma estrutura consistente e reaproveitável
para a maioria das páginas e liberdade total quando um texto merece algo único.

## O que vem por aqui

Ensaios sobre engenharia, bastidores de projetos, notas de leitura e o que mais
couber nestas margens. Se algo aqui te fizer pensar — ou discordar — me escreva.
É para isso que este espaço existe.

*Boas leituras.*
