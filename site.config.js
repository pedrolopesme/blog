// Central site configuration.
//
// baseUrl  — path the site is mounted on. GitHub Pages serves a *project*
//            repository under "/<repo>/", so production builds pass
//            BASE_URL=/blog/ (see the Makefile / CI). Local builds use "/".
// siteUrl  — absolute origin, used for RSS and canonical/OpenGraph links.
//
// Everything else here is editorial metadata you are meant to edit freely.

const baseUrl = normalizeBase(process.env.BASE_URL || "/");
const siteUrl = (process.env.SITE_URL || "https://pedrolopesme.github.io").replace(/\/$/, "");

export default {
  baseUrl,
  siteUrl,

  title: "Pedro Mendes",
  // A short, editorial tagline. Shown in the header and <title>.
  tagline: "Notas sobre tecnologia, ofício e as ideias no meio do caminho.",
  description:
    "Um blog autoral sobre tecnologia, desenvolvimento de software e o ofício " +
    "de construir coisas — escrito para ser lido com calma.",
  language: "pt-BR",

  author: {
    name: "Pedro Mendes",
    email: "pedrolopesme@gmail.com",
    url: "https://github.com/pedrolopesme",
  },

  // Primary navigation, rendered in the site header. `href` values are
  // resolved against baseUrl at build time, so keep them root-relative.
  nav: [
    { label: "Início", href: "/" },
    { label: "Escritos", href: "/posts/" },
    { label: "Temas", href: "/categorias/" },
    { label: "Sobre", href: "/sobre/" },
  ],

  // Footer links (social, contact...). Absolute URLs are left untouched.
  social: [
    { label: "GitHub", href: "https://github.com/pedrolopesme" },
    { label: "RSS", href: "/feed.xml" },
  ],

  // How many posts to feature on the home page.
  homeRecentCount: 9,

  // A short "about" blurb shown in the footer (magazine-style).
  about:
    "Um blog autoral sobre tecnologia, desenvolvimento de software e o ofício " +
    "de construir coisas — escrito para ser lido com calma.",

  // Per-theme accent colours, à la Increment's per-issue palette. Keys are
  // theme names (matched case/accent-insensitively). Unlisted themes get a
  // stable colour from the fallback palette, so this map is optional.
  themeColors: {
    "Ensaios": "#4c70b1",
    "Ofício": "#53a88e",
    "Bastidores": "#ef766e",
    "Arquitetura": "#8e65bf",
    "Ferramentas": "#d69336",
    "Leitura": "#d6658e",
    "Carreira": "#40a0ab",
    "IA": "#c05a2c",
    "Go": "#0aa0b5",
    "Cultura": "#9a5bb0",
  },

  // Fallback palette cycled deterministically for themes without an explicit
  // colour above.
  themePalette: [
    "#4c70b1", "#53a88e", "#ef766e", "#8e65bf",
    "#d69336", "#d6658e", "#40a0ab", "#863051",
  ],
};

function normalizeBase(value) {
  let v = value.trim();
  if (!v.startsWith("/")) v = "/" + v;
  if (!v.endsWith("/")) v = v + "/";
  return v;
}
