# Margens — build & authoring tasks.
#
#   make install      install dependencies
#   make dev          build for local preview and serve at :4321
#   make build        production build (into dist/)
#   make serve        serve an existing dist/ build
#   make new title="…" [cat="A,B"] [html=1]   scaffold a new post
#   make clean        remove the build output
#
# Production is a GitHub Pages *project* site, served under /<repo>/, so the
# production build is based at /blog/. Local builds are based at / for preview.

# Deploy settings (override on the CLI or in CI):
BASE_URL ?= /blog/
SITE_URL ?= https://pedrolopesme.github.io
PORT     ?= 4321

NODE ?= node
NPM  ?= npm

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo "Margens — tarefas disponíveis:"
	@echo "  make install                 instala dependências"
	@echo "  make dev                     build local + servidor em :$(PORT)"
	@echo "  make build                   build de produção (base $(BASE_URL))"
	@echo "  make serve                   serve o dist/ existente"
	@echo "  make new title=\"Título\"      cria um novo post (rascunho)"
	@echo "  make drafts                  build local incluindo rascunhos"
	@echo "  make clean                   apaga dist/"

node_modules: package.json
	$(NPM) install
	@touch node_modules

.PHONY: install
install:
	$(NPM) install

# Local preview build: based at "/", drafts excluded.
.PHONY: build-local
build-local: node_modules
	BASE_URL=/ $(NODE) build.mjs

# Production build: based at /blog/, absolute URLs for feed/sitemap.
.PHONY: build
build: node_modules
	BASE_URL=$(BASE_URL) SITE_URL=$(SITE_URL) $(NODE) build.mjs

.PHONY: dev
dev: build-local
	$(NODE) scripts/serve.mjs --port $(PORT)

.PHONY: drafts
drafts: node_modules
	INCLUDE_DRAFTS=1 BASE_URL=/ $(NODE) build.mjs
	$(NODE) scripts/serve.mjs --port $(PORT)

.PHONY: serve
serve:
	$(NODE) scripts/serve.mjs --port $(PORT)

.PHONY: new
new: node_modules
	@$(NODE) scripts/new-post.mjs $(if $(title),--title "$(title)") \
		$(if $(cat),--cat "$(cat)") $(if $(html),--html)

.PHONY: clean
clean:
	rm -rf dist
