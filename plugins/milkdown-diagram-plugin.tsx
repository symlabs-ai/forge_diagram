import { $prose } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import type { Node } from '@milkdown/prose/model';

// Types
interface DiagramBlock {
  id: string;
  type: 'mermaid' | 'plantuml';
  code: string;
  index: number;
}

interface DiagramPluginOptions {
  isDarkMode: boolean;
  onEditDiagram?: (diagram: DiagramBlock, filePath: string) => void;
  filePath?: string;
}

// Detect diagram language from code block
function getDiagramType(language: string | null, code: string): 'mermaid' | 'plantuml' | null {
  if (!language) {
    // Try to detect from content
    if (isMermaidContent(code)) return 'mermaid';
    if (isPlantUMLContent(code)) return 'plantuml';
    return null;
  }

  const lang = language.toLowerCase();
  if (lang === 'mermaid') return 'mermaid';
  if (lang === 'plantuml' || lang === 'puml') return 'plantuml';

  return null;
}

// Detect if code content looks like a mermaid diagram
function isMermaidContent(code: string): boolean {
  const mermaidKeywords = [
    /^graph\s+(TB|BT|LR|RL|TD)/im,
    /^flowchart\s+(TB|BT|LR|RL|TD)/im,
    /^sequenceDiagram/im,
    /^classDiagram/im,
    /^stateDiagram/im,
    /^erDiagram/im,
    /^gantt/im,
    /^pie/im,
    /^gitGraph/im,
    /^journey/im,
    /^mindmap/im,
    /^timeline/im,
    /^quadrantChart/im,
  ];
  return mermaidKeywords.some(regex => regex.test(code.trim()));
}

// Detect if code content looks like PlantUML
function isPlantUMLContent(code: string): boolean {
  return /^@startuml/im.test(code.trim()) || /^@startmindmap/im.test(code.trim());
}

// Render mermaid diagram
async function renderMermaid(code: string, isDarkMode: boolean): Promise<string> {
  try {
    const mermaid = await import('mermaid');
    const mermaidInstance = mermaid.default;

    mermaidInstance.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'default',
      securityLevel: 'loose',
    });

    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { svg } = await mermaidInstance.render(id, code);
    return svg;
  } catch (error: any) {
    throw new Error(`Mermaid error: ${error.message}`);
  }
}

// Render PlantUML diagram (using existing utility)
async function renderPlantUMLDiagram(code: string): Promise<string> {
  try {
    // Import the existing utility
    const { renderPlantUML } = await import('../utils/plantumlUtils');
    return await renderPlantUML(code);
  } catch (error: any) {
    throw new Error(`PlantUML error: ${error.message}`);
  }
}

// Create diagram widget element
function createDiagramWidget(
  diagramType: 'mermaid' | 'plantuml',
  code: string,
  isDarkMode: boolean,
  onDoubleClick?: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'milkdown-diagram-widget';
  container.style.cssText = `
    margin: 1rem 0;
    padding: 1rem;
    background: ${isDarkMode ? '#0f172a' : '#ffffff'};
    border: 1px solid ${isDarkMode ? '#334155' : '#e5e7eb'};
    border-radius: 0.5rem;
    cursor: pointer;
    transition: box-shadow 0.2s;
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Hover effect
  container.addEventListener('mouseenter', () => {
    container.style.boxShadow = `0 0 0 2px ${isDarkMode ? '#6366f1' : '#818cf8'}`;
  });
  container.addEventListener('mouseleave', () => {
    container.style.boxShadow = 'none';
  });

  // Double-click handler
  if (onDoubleClick) {
    container.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onDoubleClick();
    });
    container.title = 'Double-click to edit this diagram';
  }

  // Loading state
  container.innerHTML = `
    <div style="color: ${isDarkMode ? '#94a3b8' : '#64748b'}; text-align: center;">
      <div style="margin-bottom: 0.5rem;">Loading ${diagramType} diagram...</div>
      <div style="width: 24px; height: 24px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `;

  // Render diagram async
  const renderPromise = diagramType === 'mermaid'
    ? renderMermaid(code, isDarkMode)
    : renderPlantUMLDiagram(code);

  renderPromise
    .then(svg => {
      container.innerHTML = svg;
      // Make SVG responsive
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.height = 'auto';
      }
    })
    .catch(error => {
      container.innerHTML = `
        <div style="color: ${isDarkMode ? '#fca5a5' : '#dc2626'}; padding: 1rem; text-align: left; width: 100%;">
          <div style="font-weight: 600; margin-bottom: 0.5rem;">Failed to render ${diagramType} diagram:</div>
          <pre style="font-size: 0.75rem; overflow-x: auto; white-space: pre-wrap; margin: 0;">${error.message}</pre>
        </div>
      `;
    });

  return container;
}

// Plugin key for state management
const diagramPluginKey = new PluginKey('diagram-plugin');

// Create the Milkdown diagram plugin
export function createDiagramPlugin(options: DiagramPluginOptions) {
  let diagramIndex = 0;

  return $prose(() => {
    return new Plugin({
      key: diagramPluginKey,

      props: {
        decorations(state) {
          const decorations: Decoration[] = [];
          diagramIndex = 0;

          state.doc.descendants((node: Node, pos: number) => {
            // Check if this is a code block
            if (node.type.name === 'code_block' || node.type.name === 'fence') {
              const language = node.attrs.language || node.attrs.lang || null;
              const code = node.textContent;
              const diagramType = getDiagramType(language, code);

              if (diagramType) {
                const currentIndex = diagramIndex++;
                const diagram: DiagramBlock = {
                  id: `diagram-${currentIndex}`,
                  type: diagramType,
                  code: code,
                  index: currentIndex,
                };

                // Create widget decoration
                const widget = Decoration.widget(pos + node.nodeSize, () => {
                  return createDiagramWidget(
                    diagramType,
                    code,
                    options.isDarkMode,
                    options.onEditDiagram && options.filePath
                      ? () => options.onEditDiagram!(diagram, options.filePath!)
                      : undefined
                  );
                }, {
                  side: 1,
                  key: `diagram-${pos}`,
                });

                decorations.push(widget);
              }
            }

            return true;
          });

          return DecorationSet.create(state.doc, decorations);
        },
      },
    });
  });
}

export type { DiagramBlock, DiagramPluginOptions };
