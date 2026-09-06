---
title: "O peso de uma boa abstração"
date: 2026-08-20
categories: ["Arquitetura", "Ofício"]
summary: "Toda abstração cobra um aluguel. A pergunta não é se ela é elegante, mas se você continua pagando com prazer seis meses depois."
---

Abstrair é adiar uma decisão para o momento em que se sabe mais. Boa parte do
nosso trabalho é justamente esse: encontrar a linha certa onde esconder a
complexidade sem escondê-la de nós mesmos.

O problema é que abstração barata na escrita costuma ser cara na leitura. Uma
camada a mais é uma camada que alguém — talvez você, em uma terça-feira ruim —
vai precisar atravessar para entender o que de fato acontece.

> A melhor abstração é a que some: você a usa sem lembrar que ela está lá.
{.pullquote}

Meu critério envelheceu bem: uma abstração se paga quando remove repetição
*e* nomeia uma ideia. Se ela só empacota código para parecer organizada, é
dívida disfarçada de arquitetura.
