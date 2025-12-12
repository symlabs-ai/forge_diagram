/**
 * Mermaid syntax validation utilities
 */

export interface LintError {
  from: number;
  to: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
}

/**
 * Valida sintaxe Mermaid usando a API do mermaid.parse()
 */
export async function validateMermaidSyntax(code: string): Promise<LintError[]> {
  if (!code.trim()) return [];

  try {
    const mermaid = await import('mermaid');

    // Inicializa mermaid se necessário
    mermaid.default.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
    });

    // Tenta fazer parse do código
    await mermaid.default.parse(code);
    return [];
  } catch (e: any) {
    return parseErrorMessage(e, code);
  }
}

/**
 * Extrai informações do erro do Mermaid
 */
function parseErrorMessage(error: any, code: string): LintError[] {
  const message = error.message || error.str || 'Unknown syntax error';

  // Tenta extrair linha e coluna do erro
  // Formato comum: "Parse error on line X:"
  const lineMatch = message.match(/line\s+(\d+)/i);
  const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;

  // Calcula posição no documento
  const lines = code.split('\n');
  let from = 0;
  for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
    from += lines[i].length + 1; // +1 para o \n
  }

  const errorLine = lines[Math.min(line - 1, lines.length - 1)] || '';
  const to = from + errorLine.length;

  // Limpa a mensagem de erro
  const cleanMessage = message
    .split('\n')[0] // Primeira linha apenas
    .replace(/^Error:\s*/i, '')
    .replace(/^Parse error:\s*/i, '')
    .trim();

  return [{
    from: Math.max(0, from),
    to: Math.min(code.length, to || from + 1),
    severity: 'error',
    message: cleanMessage,
    line,
  }];
}

/**
 * Detecta o tipo de diagrama Mermaid
 */
export function detectDiagramType(code: string): string | null {
  const firstLine = code.trim().split('\n')[0].toLowerCase();

  const types = [
    { pattern: /^graph\s/, type: 'flowchart' },
    { pattern: /^flowchart\s/, type: 'flowchart' },
    { pattern: /^sequencediagram/, type: 'sequence' },
    { pattern: /^classdiagram/, type: 'class' },
    { pattern: /^statediagram/, type: 'state' },
    { pattern: /^erdiagram/, type: 'er' },
    { pattern: /^gantt/, type: 'gantt' },
    { pattern: /^pie/, type: 'pie' },
    { pattern: /^journey/, type: 'journey' },
    { pattern: /^gitgraph/, type: 'git' },
    { pattern: /^mindmap/, type: 'mindmap' },
    { pattern: /^timeline/, type: 'timeline' },
    { pattern: /^quadrantchart/, type: 'quadrant' },
    { pattern: /^requirementdiagram/, type: 'requirement' },
    { pattern: /^c4context/, type: 'c4' },
  ];

  for (const { pattern, type } of types) {
    if (pattern.test(firstLine)) {
      return type;
    }
  }

  return null;
}

/**
 * Retorna dicas de sintaxe baseado no tipo de diagrama
 */
export function getSyntaxHints(diagramType: string | null): string[] {
  const hints: Record<string, string[]> = {
    flowchart: [
      'Use --> para setas',
      'Use --- para linhas sem seta',
      'Use |texto| para labels nas setas',
      'Formas: [retângulo], (redondo), {losango}, ((círculo))',
    ],
    sequence: [
      'Use ->> para mensagem síncrona',
      'Use -->> para resposta',
      'Use activate/deactivate para lifelines',
      'Use Note over/left of/right of para notas',
    ],
    class: [
      'Use <|-- para herança',
      'Use *-- para composição',
      'Use o-- para agregação',
      'Use + para público, - para privado',
    ],
    state: [
      'Use --> para transições',
      'Use [*] para estado inicial/final',
      'Use state "nome" as alias',
    ],
    er: [
      'Use ||--o{ para relações',
      'Cardinalidade: ||, |o, o|, }|, }o, o{',
    ],
    gantt: [
      'Use section para agrupar tarefas',
      'Formato: nome :id, data_início, duração',
      'Use after id para dependências',
    ],
  };

  return hints[diagramType || ''] || ['Digite código Mermaid válido'];
}
