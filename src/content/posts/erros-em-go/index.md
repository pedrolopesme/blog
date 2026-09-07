---
title: "Erros em Go"
categories: ["Go", "Ofício"]
cover: "capa.png"
coverAlt: "Erros em Go"
---

O tratamento de erros em Go define sua a relação com a linguagem logo no primeiro dia.

Quando comecei a trabalhar com Go, uma das primeiras coisas que notei foi a simplicidade – ou, para alguns, a monotonia– da abordagem da linguagem.  Vindo de outras linguagens, confesso que minha reação inicial foi de frustração.

Em Go, erros não são exceções mágicas que interrompem o fluxo do programa. Eles são valores [1].

Essa ideia, repetida quase como um mantra pelos criadores da linguagem, me forçou a repensar a forma como lidava com falhas. Afinal, se erros são valores, cabe a mim, como desenvolvedor, tratá-los explicitamente.

A verdade é que escrever if err != nil  vira repetitivo. Cada erro precisa de uma verificação, de um retorno, de uma mensagem clara para indicar o que deu errado.

Mas, ao mesmo tempo, comecei perceber sentido nesse padrão. Ele me força a prestar atenção, a pensar no que deve acontecer em cada situação de falha.

O desafio se tornou ainda mais interessante quando você trabalha com paralelismo, uma das forças do Go.

O livro **Concurrency in Go: Tools and Techniques for Developers [2] destaca  isso: **

“Em programas concorrentes, o tratamento de erros pode ser especialmente desafiador. Às vezes, passamos tanto tempo pensando em como nossos processos vão compartilhar informações que esquecemos de planejar como eles lidarão com estados de falha. (…) A questão fundamental é: ‘Quem deve ser responsável por lidar com o erro?’ Em algum momento, o programa precisa parar de propagar o erro e, de fato, fazer algo a respeito”

Katherine Cox-Buday. Concurrency in Go: Tools and Techniques for Developers.

Essa visão reforça um princípio fundamental do Go: simplicidade e previsibilidade são mais importantes que abstrações sofisticadas.

Ainda assim, há momentos em que o código pode ficar poluído. Quando lidamos com várias operações consecutivas, cada uma passível de falha, o número de verificações if err != nil cresce rapidamente, tornando o código menos legível.

Um atalho nesse processo para alguns é a dupla panic e recover. Desde o início, ficou claro pra mim que essas ferramentas não devem ser usadas para tratar falhas comuns. Elas são como um botão de emergência, reservado para situações realmente críticas.

Essa abordagem reforça a filosofia do Go: erros devem ser tratados diretamente, não escondidos atrás de mecanismos que complicam o entendimento do código.

Essa insatisfação com a repetição no tratamento de erros leva, de tempos em tempos, a novas propostas no repositório oficial do Go. Recentemente, uma dessas propostas chamou atenção: [a issue #71203](https://github.com/golang/go/issues/71203) [3], que sugere mudanças para reduzir a redundância no tratamento de erros sem comprometer a filosofia da linguagem.

Com o tempo, comecei a enxergar o padrão de tratamento de erros do Go como um exercício constante de responsabilidade.

Cada if err != nil é uma oportunidade de pensar no comportamento do programa, de antecipar problemas e de construir algo mais robusto. É um pouco chato em alguns momentos, mas é exatamente essa insistência no explícito que torna o código mais previsível -e, portanto, confiável.

Hoje, vejo o tratamento de erros em Go como uma parte fundamental da experiência de trabalhar com a linguagem.

Não é glamouroso, e muitas vezes exige paciência, mas é justamente essa abordagem que me lembra que escrever código de qualidade é mais do que resolver problemas técnicos – é sobre assumir a responsabilidade pelo que construo.

Links:

[1] - “**Errors are values” - **[https://go.dev/blog/errors-are-values](https://go.dev/blog/errors-are-values)
[2] - Concurrency in Go: Tools and Techniques for Developers - [https://amzn.to/42nNKQU](https://amzn.to/42nNKQU)
[3] -  “proposal: spec: reduce error handling boilerplate using ?“ - [https://github.com/golang/go/issues/71203](https://github.com/golang/go/issues/71203)
