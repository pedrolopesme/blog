---
title: "Anti-Patterns de Performance"
categories: ["Ofício"]
cover: "capa.webp"
coverAlt: "Anti-Patterns de Performance"
background: "background.webp"
---

A tecnologia vive de ciclos, e um dos mais frequentes é redescobrir como *não* fazer as coisas.

Lendo o paper chamado *Performance Anti-Patterns [1]*, percebi o quanto estamos sujeitos a cair nas mesmas armadilhas ao tentar otimizar software. É interessante observar como esses erros estão conectados por uma característica comum: a falta de planejamento ou a insistência em atalhos ilusórios.

Comecemos pela tentação de deixar a preocupação com performance para o final do projeto.

Essa prática é tão comum quanto desastrosa. Performance não é algo que você simplesmente espalha sobre o software como maquiagem no último minuto. Quando deixada para o final, a performance se torna um incêndio a ser apagado.

Mas o problema não termina aí. Muitas vezes, mesmo quando há um esforço para medir o desempenho, ele é mal direcionado.

Se você mede o que não importa, acaba otimizando na direção errada. Um exemplo citado no paper é o caso de benchmarks que garantiam apenas que o sistema seria “um pouco pior” a cada versão. Parece piada.

Benchmarks precisam ser realistas e úteis, algo que reflete o comportamento dos usuários no mundo real.

Parte do problema também está na reutilização de código sem revisar as premissas em que ele foi construído. O que funcionava bem há 10 anos atrás dificilmente será adequado às demandas de hoje.

A solução está na revisão constante dessas escolhas e na documentação cuidadosa das premissas originais.

A essa altura, é impossível ignorar o papel das camadas no design de software. Embora abstrações sejam úteis, o abuso de camadas é um convite ao desperdício de recursos.

Essa prática, em vez de criar robustez, gera uma pilha de complexidade que atrapalha mais do que ajuda.

E aí chegamos a um clichê inevitável: a otimização prematura.

Quantas vezes já vimos desenvolvedores gastarem tempo “melhorando” algo que nem sabemos se será um problema? Essa é uma das armadilhas mais antigas, e Donald Knuth já cravou a frase definitiva sobre o tema: “A otimização prematura é a raiz de todo o mal”.

Primeiro, resolva o essencial; depois, veja onde faz sentido otimizar.

Conectar tudo isso ao hardware nos lembra que a tecnologia pode ser tanto amiga quanto inimiga.

Por fim, temos o uso excessivo de paralelismo, um erro comum quando desenvolvedores acreditam que “uma thread por tarefa” é uma solução simples e elegante.

Em pequenos testes, pode até parecer funcional, mas em cenários reais, com altas cargas, o resultado é um caos. A solução está em modelos que limitem o número de threads e priorizem arquiteturas assíncronas.

No fim das contas, a performance não é sobre truques ou atalhos; é sobre consistência.

Começa com decisões inteligentes, métricas bem definidas e uma compreensão clara do que é realmente importante para os usuários. Como o próprio paper deixa claro, o segredo não é fazer mais rápido, mas fazer menos – e fazer melhor.

Afinal, correr mais rápido não ajuda em nada se você está na direção errada.

[1] Paper: [https://queue.acm.org/detail.cfm?id=1117403](https://queue.acm.org/detail.cfm?id=1117403)
