// Scaffold a new post directory with front-matter and a place for assets.
//
//   node scripts/new-post.mjs "Título do post" [--cat Tema1,Tema2] [--html]
//   make new title="Título do post"
//
// Creates src/content/posts/<slug>/index.md (or index.html with --html),
// pre-filled with today's date and a starter body.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const raw = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < raw.length; i++) {
  if (raw[i].startsWith("--")) {
    const key = raw[i].slice(2);
    const next = raw[i + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else flags[key] = true;
  } else positional.push(raw[i]);
}

const title = (flags.title || positional.join(" ")).trim();
if (!title) {
  console.error('Uso: make new title="Título do post" [cat="Tema"]');
  process.exit(1);
}

const asHtml = Boolean(flags.html);
const cats = String(flags.cat || flags.category || "")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

const slug = slugify(title);
const today = new Date().toISOString().slice(0, 10);
const dir = path.join(ROOT, "src", "content", "posts", slug);

const catLine = cats.length
  ? `categories: [${cats.map((c) => JSON.stringify(c)).join(", ")}]`
  : `categories: []`;

const frontMatter = `---
title: ${JSON.stringify(title)}
date: ${today}
${catLine}
summary: ""
draft: true
# Recursos opcionais deste post (relativos a esta pasta):
# styles: ["style.css"]
# scripts: ["grafico.js"]
# theme: ""        # aplica a classe body.theme-<nome>
# cover: "capa.jpg"
# coverAlt: ""
---
`;

const mdBody = `
Comece por aqui. Escreva em Markdown com liberdade — e, quando precisar,
misture HTML rico no meio do texto.

## Um subtítulo

Texto do corpo. Você pode usar componentes reutilizáveis via classes:

> Uma citação de destaque.
{.pullquote}

<aside class="callout callout--note">
  <strong>Nota:</strong> este bloco é um componente reutilizável (ver README).
</aside>

\`\`\`js
console.log("blocos de código já vêm com realce de sintaxe");
\`\`\`

Para algo totalmente específico deste post (um gráfico, um widget), declare
\`scripts\`/\`styles\` no front-matter e coloque os arquivos nesta mesma pasta.
`;

const htmlBody = `
<p>
  Este post é HTML puro (front-matter + corpo). Use quando quiser controle
  total do markup. Ainda vale toda a tipografia e os componentes globais.
</p>

<h2>Seção</h2>
<p>Escreva à vontade.</p>
`;

async function main() {
  try {
    await fs.access(dir);
    console.error(`✗ já existe: ${path.relative(ROOT, dir)}`);
    process.exit(1);
  } catch {
    /* ok, does not exist */
  }
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, asHtml ? "index.html" : "index.md");
  await fs.writeFile(file, frontMatter + (asHtml ? htmlBody : mdBody), "utf8");
  console.log(`✓ criado ${path.relative(ROOT, file)}`);
  console.log(`  (draft: true — remova para publicar)`);
}

function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main();
