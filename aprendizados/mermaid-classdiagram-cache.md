# Mermaid: Cache de Layout em classDiagram

## Problema

Ao alternar a direção (`direction TD` / `direction LR`) em um `classDiagram`, o Mermaid não re-renderiza o layout corretamente após a primeira mudança. O diagrama fica "travado" em uma orientação.

### Comportamento observado:
1. Primeira renderização (TD) - OK
2. Toggle para LR - OK
3. Toggle de volta para TD - **FALHA** (mantém layout LR)
4. Toggles subsequentes - sempre mantém o layout cacheado

### Por que `graph` funciona e `classDiagram` não?

- **`graph TD` / `graph LR`**: A direção faz parte da declaração do tipo do diagrama. O Mermaid trata como diagramas completamente diferentes.

- **`classDiagram` com `direction TD/LR`**: A direção é uma diretiva interna. O Mermaid cacheia o layout baseado no tipo do diagrama (`classDiagram`), ignorando mudanças na diretiva `direction`.

## Diagnóstico

Logs mostraram que mesmo com:
- IDs de SVG diferentes
- Código fonte diferente (`direction TD` vs `direction LR`)
- Reimportação do módulo Mermaid

O `viewBox` do SVG retornado era idêntico, indicando que o layout cacheado estava sendo reutilizado.

```
mermaid3 (LR): viewBox="0 0 1778.5625 1153.5"
mermaid4 (TD): viewBox="0 0 1778.5625 1153.5"  // IGUAL! Deveria ser diferente
```

## Soluções Tentadas (que NÃO funcionaram)

1. **IDs únicos** - Mermaid ignora o ID para cache de layout
2. **Reimportar o módulo** - ES modules são cacheados pelo browser
3. **Limpar SVGs órfãos do DOM** - Cache é interno, não no DOM
4. **Adicionar comentários únicos** - Mermaid ignora comentários para cache
5. **Adicionar classe dummy** - Não altera o cálculo de layout
6. **`mermaidAPI.reset()`** - Não existe ou não funciona

## Solução que Funcionou

Usar a diretiva `%%{init}%%` com um valor dinâmico que muda a cada render:

```javascript
if (code.trim().toLowerCase().startsWith('classdiagram')) {
  const hasLR = /direction\s+LR/i.test(code);
  const direction = hasLR ? 'LR' : 'TB';
  const initDirective = `%%{init: {'flowchart': {'diagramPadding': ${renderCounter}}, 'class': {'defaultRenderer': 'dagre-wrapper'}}}%%\n`;
  codeToRender = initDirective + code;
}
```

### Por que funciona?

O Mermaid considera a configuração `%%{init}%%` como parte da identidade do diagrama para fins de cache. Ao mudar o `diagramPadding` (ou qualquer outro valor) a cada render, forçamos o Mermaid a recalcular o layout completo.

## Aplicabilidade

Esta solução pode ser necessária para outros tipos de diagrama que usam `direction` como diretiva interna:
- `classDiagram`
- `stateDiagram` / `stateDiagram-v2`
- `flowchart` com subgraphs que têm `direction` próprio

## Referências

- Mermaid versão: 10.6.1
- Data: 2025-12-12
