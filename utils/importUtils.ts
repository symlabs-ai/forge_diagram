/**
 * Import utilities for converting PlantUML and draw.io to Mermaid
 */

export type ImportFormat = 'plantuml' | 'drawio' | 'unknown';

export interface ImportResult {
  code: string;
  warnings: string[];
  format: ImportFormat;
}

/**
 * Detect the format of the input content
 */
export function detectFormat(content: string): ImportFormat {
  const trimmed = content.trim();

  if (trimmed.includes('@startuml') || trimmed.includes('@startmindmap') ||
      trimmed.includes('@startgantt') || trimmed.includes('@startwbs')) {
    return 'plantuml';
  }

  if (trimmed.includes('<mxGraphModel') || trimmed.includes('<diagram') ||
      trimmed.includes('mxCell')) {
    return 'drawio';
  }

  return 'unknown';
}

/**
 * Convert PlantUML to Mermaid
 */
export function convertPlantUML(content: string): ImportResult {
  const warnings: string[] = [];
  let mermaid = '';

  // Remove PlantUML wrapper
  let body = content
    .replace(/@startuml\b.*?\n?/gi, '')
    .replace(/@enduml\b/gi, '')
    .replace(/@startmindmap\b.*?\n?/gi, '')
    .replace(/@endmindmap\b/gi, '')
    .trim();

  // Detect diagram type
  const isSequence = /->|<-|-->|<--|:>|<:|participant|actor/i.test(body);
  const isClass = /class\s+\w+|interface\s+\w+|abstract\s+class/i.test(body);
  const isMindmap = content.includes('@startmindmap');

  if (isMindmap) {
    // Convert mindmap
    mermaid = 'mindmap\n  root((Root))\n';
    const lines = body.split('\n').filter(l => l.trim());
    lines.forEach(line => {
      const match = line.match(/^(\*+)\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        mermaid += '  '.repeat(level) + text + '\n';
      }
    });
    warnings.push('Mindmap conversion is basic - review structure');
  } else if (isSequence) {
    // Convert sequence diagram
    mermaid = 'sequenceDiagram\n';

    const lines = body.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("'") || trimmedLine.startsWith('note')) {
        return;
      }

      // Participant/Actor declarations
      const participantMatch = trimmedLine.match(/^(participant|actor)\s+(\w+)(?:\s+as\s+"([^"]+)")?/i);
      if (participantMatch) {
        const type = participantMatch[1].toLowerCase();
        const name = participantMatch[2];
        const alias = participantMatch[3] || name;
        mermaid += `  ${type} ${name} as ${alias}\n`;
        return;
      }

      // Arrow messages: A -> B : message
      const arrowMatch = trimmedLine.match(/^(\w+)\s*(->|-->|<-|<--|->o|o<-|->x|x<-)\s*(\w+)\s*:\s*(.+)$/);
      if (arrowMatch) {
        const from = arrowMatch[1];
        const arrow = arrowMatch[2];
        const to = arrowMatch[3];
        const message = arrowMatch[4];

        // Convert arrow types
        let mermaidArrow = '->>';
        if (arrow.includes('--')) mermaidArrow = '-->>';
        if (arrow.startsWith('<')) {
          // Reverse direction
          mermaid += `  ${to}${mermaidArrow}${from}: ${message}\n`;
        } else {
          mermaid += `  ${from}${mermaidArrow}${to}: ${message}\n`;
        }
        return;
      }

      // Simple arrow without message
      const simpleArrowMatch = trimmedLine.match(/^(\w+)\s*(->|-->|<-|<--)\s*(\w+)$/);
      if (simpleArrowMatch) {
        const from = simpleArrowMatch[1];
        const to = simpleArrowMatch[3];
        mermaid += `  ${from}->>+${to}: \n`;
        return;
      }
    });

    warnings.push('Some PlantUML sequence features may not have direct Mermaid equivalents');
  } else if (isClass) {
    // Convert class diagram
    mermaid = 'classDiagram\n';

    const lines = body.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("'")) {
        return;
      }

      // Class declarations
      const classMatch = trimmedLine.match(/^(abstract\s+)?class\s+(\w+)(?:\s*\{)?/i);
      if (classMatch) {
        const className = classMatch[2];
        mermaid += `  class ${className}\n`;
        return;
      }

      // Interface declarations
      const interfaceMatch = trimmedLine.match(/^interface\s+(\w+)/i);
      if (interfaceMatch) {
        mermaid += `  class ${interfaceMatch[1]}\n`;
        mermaid += `  <<interface>> ${interfaceMatch[1]}\n`;
        return;
      }

      // Relationships: A --|> B
      const relationMatch = trimmedLine.match(/^(\w+)\s*(--|>|<|--|\.\.>|<\.\.|--\*|--o|\.\.\||--)\s*(\w+)/);
      if (relationMatch) {
        const from = relationMatch[1];
        const rel = relationMatch[2];
        const to = relationMatch[3];

        let mermaidRel = '-->';
        if (rel.includes('>') && rel.includes('|')) mermaidRel = '--|>';
        else if (rel.includes('..')) mermaidRel = '..>';
        else if (rel.includes('*')) mermaidRel = '*--';
        else if (rel.includes('o')) mermaidRel = 'o--';

        mermaid += `  ${from} ${mermaidRel} ${to}\n`;
        return;
      }
    });

    warnings.push('Class diagram conversion is basic - add methods and attributes manually');
  } else {
    // Default: treat as flowchart
    mermaid = 'flowchart TD\n';

    const lines = body.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("'")) return;

      // Simple node connections: A --> B
      const connectionMatch = trimmedLine.match(/^(\w+)\s*(->|-->)\s*(\w+)(?:\s*:\s*(.+))?$/);
      if (connectionMatch) {
        const from = connectionMatch[1];
        const to = connectionMatch[3];
        const label = connectionMatch[4];
        if (label) {
          mermaid += `  ${from} -->|${label}| ${to}\n`;
        } else {
          mermaid += `  ${from} --> ${to}\n`;
        }
      }
    });

    warnings.push('Converted as basic flowchart - review and adjust');
  }

  return {
    code: mermaid.trim(),
    warnings,
    format: 'plantuml',
  };
}

/**
 * Convert draw.io XML to Mermaid
 */
export function convertDrawIO(content: string): ImportResult {
  const warnings: string[] = [];
  let mermaid = 'flowchart TD\n';

  try {
    // Parse XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');

    // Find all cells
    const cells = doc.querySelectorAll('mxCell');
    const nodes = new Map<string, { id: string; label: string }>();
    const edges: Array<{ source: string; target: string; label?: string }> = [];

    cells.forEach(cell => {
      const id = cell.getAttribute('id');
      const value = cell.getAttribute('value') || '';
      const source = cell.getAttribute('source');
      const target = cell.getAttribute('target');
      const vertex = cell.getAttribute('vertex');
      const edge = cell.getAttribute('edge');

      if (!id) return;

      // Skip root cells (id 0 and 1)
      if (id === '0' || id === '1') return;

      if (vertex === '1' && value) {
        // It's a node
        const cleanLabel = value.replace(/<[^>]*>/g, '').trim() || `Node${id}`;
        const safeId = `n${id.replace(/[^a-zA-Z0-9]/g, '')}`;
        nodes.set(id, { id: safeId, label: cleanLabel });
      } else if (edge === '1' && source && target) {
        // It's an edge
        edges.push({
          source,
          target,
          label: value.replace(/<[^>]*>/g, '').trim(),
        });
      }
    });

    // Generate Mermaid nodes
    nodes.forEach((node) => {
      mermaid += `  ${node.id}["${node.label}"]\n`;
    });

    // Generate Mermaid edges
    edges.forEach(edge => {
      const sourceNode = nodes.get(edge.source);
      const targetNode = nodes.get(edge.target);

      if (sourceNode && targetNode) {
        if (edge.label) {
          mermaid += `  ${sourceNode.id} -->|${edge.label}| ${targetNode.id}\n`;
        } else {
          mermaid += `  ${sourceNode.id} --> ${targetNode.id}\n`;
        }
      }
    });

    if (nodes.size === 0) {
      warnings.push('No nodes found in draw.io file');
    }

    warnings.push('draw.io conversion is basic - complex shapes and styling not preserved');
  } catch (e) {
    warnings.push(`XML parsing error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    mermaid = 'flowchart TD\n  A[Parse Error] --> B[Check XML format]';
  }

  return {
    code: mermaid.trim(),
    warnings,
    format: 'drawio',
  };
}

/**
 * Import diagram from any supported format
 */
export function importDiagram(content: string): ImportResult {
  const format = detectFormat(content);

  switch (format) {
    case 'plantuml':
      return convertPlantUML(content);
    case 'drawio':
      return convertDrawIO(content);
    default:
      return {
        code: content,
        warnings: ['Format not recognized - pasted as-is'],
        format: 'unknown',
      };
  }
}
