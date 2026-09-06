---
title: "Go 1.24: go tool, weak pointers e outros"
categories: ["Go"]
---

Go chega a versão 1.24 agora em Fevereiro, trazendo novidades.

A nova versão foca em melhorias na linguagem (**Generic Type Aliases, Weak Pointers, Finalizers**), otimizações de performance (**Swiss Tables, Concurrent Maps**), aprimoramentos em testes (**Test Contexts, Synthetic Time**), melhorias nas bibliotecas padrão (**SHA-3, HTTP/3**), além de ajustes no ecossistema (Go **Tool , JSON Output**).

Segue alguns destaques:

👉  go tool

Com o go tool, podemos declarar ferramentas diretamente no go.mod, sem precisar recorrer a um arquivo separado (ex: tools.go).

Pra usar, basta adicionar a ferramenta desejada, como:
go get -tool [github.com/vektra/mockery/v2@v2.52.1](http://github.com/vektra/mockery/v2@v2.52.1)

E para executá-la:
go tool [github.com/vektra/mockery/v2](http://github.com/vektra/mockery/v2)

Há quem ame, há quem odeie. A comunidade de Go é sempre muito dividida.

Na prática, o go tool será útil para gerenciar o tooling durante o ciclo de desenvolvimento, como geradores de código e linters.

O principal risco é de conflitos das dependências. Tem que ficar ligado para não ter dor de cabeça.

👉 Aliás de Generic Types

Agora você pode criar atalhos para tipos genéricos, o que ajuda a reduzir redundância e (pode) melhorar a legibilidade do código.

Em vez de repetir definições complexas, basta criar um alias e reutilizá-lo. A ref contém exemplos [1].

👉 Weak pointers

Agora é possível referenciar um objeto sem impedir que o garbage collector remova-o quando necessário [2].

Isso ajuda a manter associações fracas entre estruturas, o que pode ser útil em algumas (poucas) situações. A criação de caches temporários é uma delas.

Porém, ponteiros fracos podem ser um tiro no pé: se o objeto referenciado for coletado pelo GC, ganhamos um nil de presente.

A regra aqui é não usar, a não ser que o ganho seja muito claro. Do contrário pode sofrer com panics surpresas.

👉  Outras novidades:

⚫ Swiss Tables – Mapas mais rápidos e eficientes.
⚫  Maps mais seguros em cenários de concorrência (e sem mutexes 🙏).
⚫  Controle de acesso a diretórios por escopo.
⚫ Test Contexts – Suporte a contextos em testes.
⚫  Synthetic Time – Simulação de tempo para testes.
⚫  Refinamento no controle sobre loops em benchmarks.
⚫  Suporte a novas funções hash no SHA-3 .
⚫  Melhorias na lib de HTTP – Melhor suporte a HTTP/3.

O Anton Zhiyanov fez um excelente trabalho compilando as novidades em seu site [3]. Vale conferir.

Links:

[1] [https://go.dev/ref/spec#Alias_declarations](https://go.dev/ref/spec#Alias_declarations)
[2] [https://github.com/golang/go/issues/67552](https://github.com/golang/go/issues/67552)
[3] [https://antonz.org/go-1-24/](https://antonz.org/go-1-24/)
