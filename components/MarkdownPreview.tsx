import React, { useMemo, useEffect, useState, useRef } from 'react';
import { isPlantUML, renderPlantUML } from '../utils/plantumlUtils';
import { MarkdownTheme, generateMarkdownCSS } from '../utils/markdownThemes';

interface MarkdownPreviewProps {
  content: string;
  isDarkMode: boolean;
  theme?: MarkdownTheme;
}

interface DiagramBlock {
  id: string;
  type: 'mermaid' | 'plantuml';
  code: string;
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
    /^requirementDiagram/im,
    /^C4Context/im,
    /^sankey/im,
  ];
  return mermaidKeywords.some(regex => regex.test(code.trim()));
}

// Detect if code content looks like PlantUML
function isPlantUMLContent(code: string): boolean {
  return /^@startuml/im.test(code.trim()) || /^@startmindmap/im.test(code.trim());
}

// Extract diagram blocks from markdown and replace with placeholders
function extractDiagrams(markdown: string): { html: string; diagrams: DiagramBlock[] } {
  const diagrams: DiagramBlock[] = [];
  let diagramCounter = 0;

  // Normalize line endings
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // First pass: Extract explicitly tagged mermaid/plantuml code blocks
  let processed = normalized.replace(
    /```\s*(mermaid|plantuml|puml)\s*\n([\s\S]*?)```/gi,
    (_, lang, code) => {
      const id = `diagram-${diagramCounter++}`;
      const type = lang.toLowerCase() === 'mermaid' ? 'mermaid' : 'plantuml';
      diagrams.push({ id, type, code: code.trim() });
      return `\n<div class="diagram-placeholder" data-diagram-id="${id}"></div>\n`;
    }
  );

  // Second pass: Detect untagged code blocks that look like diagrams
  processed = processed.replace(
    /```\s*\n([\s\S]*?)```/g,
    (match, code) => {
      const trimmedCode = code.trim();

      if (isMermaidContent(trimmedCode)) {
        const id = `diagram-${diagramCounter++}`;
        diagrams.push({ id, type: 'mermaid', code: trimmedCode });
        return `\n<div class="diagram-placeholder" data-diagram-id="${id}"></div>\n`;
      }

      if (isPlantUMLContent(trimmedCode)) {
        const id = `diagram-${diagramCounter++}`;
        diagrams.push({ id, type: 'plantuml', code: trimmedCode });
        return `\n<div class="diagram-placeholder" data-diagram-id="${id}"></div>\n`;
      }

      // Not a diagram, keep as-is
      return match;
    }
  );

  return { html: processed, diagrams };
}

// Simple markdown parser - converts markdown to HTML
function parseMarkdown(markdown: string): string {
  let html = markdown;

  // Process blockquotes FIRST (before HTML escape, since > would become &gt;)
  // Match lines starting with > and optional space
  html = html.replace(/^>\s?(.*)$/gm, '%%%BLOCKQUOTE_START%%%$1%%%BLOCKQUOTE_END%%%');

  // Extract code blocks BEFORE HTML escaping to preserve their content
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const index = codeBlocks.length;
    const langClass = lang ? ` class="language-${lang}"` : '';
    // Escape HTML inside code blocks separately
    const escapedCode = code.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    codeBlocks.push(`<pre class="code-block"><code${langClass}>${escapedCode}</code></pre>`);
    return `%%%CODEBLOCK_${index}%%%`;
  });

  // Escape HTML to prevent XSS (but not our placeholders)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Restore our placeholders
    .replace(/&lt;div class="diagram-placeholder" data-diagram-id="([^"]+)"&gt;&lt;\/div&gt;/g,
      '<div class="diagram-placeholder" data-diagram-id="$1"></div>');

  // Now convert blockquote markers to actual HTML
  html = html.replace(/%%%BLOCKQUOTE_START%%%/g, '<blockquote>');
  html = html.replace(/%%%BLOCKQUOTE_END%%%/g, '</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '<br/>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headers
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // Bold and italic (asterisks always work)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Underscores only work at word boundaries (not inside words like admin_api_ui)
  // Uses negative lookbehind/lookahead to ensure _ is not adjacent to alphanumeric chars
  html = html.replace(/(?<![a-zA-Z0-9])___([^_\n]+?)___(?![a-zA-Z0-9])/g, '<strong><em>$1</em></strong>');
  html = html.replace(/(?<![a-zA-Z0-9])__([^_\n]+?)__(?![a-zA-Z0-9])/g, '<strong>$1</strong>');
  html = html.replace(/(?<![a-zA-Z0-9])_([^_\n]+?)_(?![a-zA-Z0-9])/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-image" />');

  // Horizontal rule
  html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr />');

  // Unordered lists
  html = html.replace(/^[\*\-]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');

  // Paragraphs - wrap remaining text
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip if it's already an HTML tag or empty or placeholder
    if (line === '' ||
        line.startsWith('<h') ||
        line.startsWith('<ul') ||
        line.startsWith('<ol') ||
        line.startsWith('<li') ||
        line.startsWith('<pre') ||
        line.startsWith('<blockquote') ||
        line.startsWith('<hr') ||
        line.startsWith('<div class="diagram') ||
        line.startsWith('%%%CODEBLOCK_') ||
        line.startsWith('</')) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push(line);
    } else {
      if (!inParagraph) {
        processedLines.push('<p>');
        inParagraph = true;
      }
      processedLines.push(line);
    }
  }

  if (inParagraph) {
    processedLines.push('</p>');
  }

  html = processedLines.join('\n');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Restore code blocks from placeholders
  codeBlocks.forEach((block, index) => {
    html = html.replace(`%%%CODEBLOCK_${index}%%%`, block);
  });

  return html;
}

// Component to render a single diagram
const DiagramRenderer: React.FC<{
  diagram: DiagramBlock;
  isDarkMode: boolean;
}> = ({ diagram, isDarkMode }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      setLoading(true);
      setError(null);

      try {
        if (diagram.type === 'plantuml') {
          const result = await renderPlantUML(diagram.code);
          if (!cancelled) {
            setSvg(result);
          }
        } else {
          // Mermaid
          const mermaid = await import('mermaid');
          const mermaidInstance = mermaid.default;

          mermaidInstance.initialize({
            startOnLoad: false,
            theme: isDarkMode ? 'dark' : 'default',
            securityLevel: 'loose',
          });

          const id = `mermaid-${diagram.id}-${Date.now()}`;
          const { svg: renderedSvg } = await mermaidInstance.render(id, diagram.code);

          if (!cancelled) {
            setSvg(renderedSvg);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to render diagram');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [diagram, isDarkMode]);

  if (loading) {
    return (
      <div className="diagram-container flex items-center justify-center p-4 bg-gray-100 dark:bg-slate-700 rounded-lg my-4">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Rendering {diagram.type} diagram...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diagram-container p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg my-4">
        <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
          Failed to render {diagram.type} diagram:
        </div>
        <pre className="text-red-500 dark:text-red-300 text-xs overflow-auto">
          {error}
        </pre>
        <details className="mt-2">
          <summary className="text-gray-500 dark:text-gray-400 text-xs cursor-pointer">
            Show source code
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-slate-800 rounded text-xs overflow-auto">
            {diagram.code}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="diagram-container flex justify-center p-4 bg-white dark:bg-slate-800 rounded-lg my-4 overflow-auto border border-gray-200 dark:border-slate-600"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, isDarkMode, theme }) => {
  const { html, diagrams } = useMemo(() => {
    const extracted = extractDiagrams(content || '');
    return {
      html: parseMarkdown(extracted.html),
      diagrams: extracted.diagrams,
    };
  }, [content]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate themed CSS if theme is provided
  const themedCSS = useMemo(() => {
    if (theme) {
      return generateMarkdownCSS(theme);
    }
    return '';
  }, [theme]);

  // Render diagrams into placeholders after initial render
  useEffect(() => {
    if (!containerRef.current || diagrams.length === 0) return;

    // Find all placeholders and render diagrams
    const placeholders = containerRef.current.querySelectorAll('.diagram-placeholder');
    placeholders.forEach((placeholder) => {
      const diagramId = placeholder.getAttribute('data-diagram-id');
      if (diagramId) {
        // Mark as processed
        placeholder.setAttribute('data-processed', 'true');
      }
    });
  }, [html, diagrams]);

  // If theme is provided, use themed preview
  if (theme) {
    return (
      <div className="markdown-preview-themed h-full overflow-auto">
        <style>{themedCSS}</style>
        <style>{`
          .markdown-preview-themed .diagram-container {
            display: flex;
            justify-content: center;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
            overflow: auto;
          }
          .markdown-preview-themed .diagram-container svg {
            max-width: 100%;
            height: auto;
          }
        `}</style>

        <div className="markdown-content" ref={containerRef}>
          {diagrams.length === 0 ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <MarkdownWithDiagrams html={html} diagrams={diagrams} isDarkMode={isDarkMode} />
          )}
        </div>
      </div>
    );
  }

  // Default (non-themed) preview - fallback using isDarkMode
  return (
    <div
      className={`markdown-preview h-full overflow-auto p-6 ${
        isDarkMode ? 'bg-slate-800 text-gray-100' : 'bg-white text-gray-900'
      }`}
    >
      <style>{`
        .markdown-preview h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          padding-bottom: 0.3em;
          border-bottom: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
        }
        .markdown-preview h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.83em 0;
          padding-bottom: 0.3em;
          border-bottom: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
        }
        .markdown-preview h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 1em 0;
        }
        .markdown-preview h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1.33em 0;
        }
        .markdown-preview h5 {
          font-size: 0.875em;
          font-weight: bold;
          margin: 1.67em 0;
        }
        .markdown-preview h6 {
          font-size: 0.85em;
          font-weight: bold;
          margin: 2.33em 0;
          color: ${isDarkMode ? '#9ca3af' : '#6b7280'};
        }
        .markdown-preview p {
          margin: 1em 0;
          line-height: 1.6;
        }
        .markdown-preview a {
          color: ${isDarkMode ? '#60a5fa' : '#2563eb'};
          text-decoration: underline;
        }
        .markdown-preview a:hover {
          color: ${isDarkMode ? '#93c5fd' : '#1d4ed8'};
        }
        .markdown-preview ul, .markdown-preview ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        .markdown-preview ul {
          list-style-type: disc;
        }
        .markdown-preview ol {
          list-style-type: decimal;
        }
        .markdown-preview li {
          margin: 0.5em 0;
        }
        .markdown-preview blockquote {
          margin: 1em 0;
          padding: 0.5em 1em;
          border-left: 4px solid ${isDarkMode ? '#4b5563' : '#d1d5db'};
          background: ${isDarkMode ? '#1f2937' : '#f3f4f6'};
          color: ${isDarkMode ? '#9ca3af' : '#6b7280'};
        }
        .markdown-preview .code-block {
          background: ${isDarkMode ? '#0f172a' : '#1f2937'};
          color: ${isDarkMode ? '#e5e7eb' : '#f3f4f6'};
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin: 1em 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875em;
        }
        .markdown-preview .inline-code {
          background: ${isDarkMode ? '#374151' : '#e5e7eb'};
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875em;
        }
        .markdown-preview hr {
          border: none;
          border-top: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'};
          margin: 2em 0;
        }
        .markdown-preview strong {
          font-weight: bold;
        }
        .markdown-preview em {
          font-style: italic;
        }
        .markdown-preview del {
          text-decoration: line-through;
        }
        .markdown-preview .md-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
          margin: 1em 0;
        }
        .markdown-preview .diagram-container svg {
          max-width: 100%;
          height: auto;
        }
      `}</style>

      <div ref={containerRef}>
        {/* Render HTML content with diagram placeholders replaced by actual components */}
        {diagrams.length === 0 ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <MarkdownWithDiagrams html={html} diagrams={diagrams} isDarkMode={isDarkMode} />
        )}
      </div>
    </div>
  );
};

// Component that renders markdown HTML with embedded diagrams
const MarkdownWithDiagrams: React.FC<{
  html: string;
  diagrams: DiagramBlock[];
  isDarkMode: boolean;
}> = ({ html, diagrams, isDarkMode }) => {
  // Split HTML by diagram placeholders
  const parts = html.split(/<div class="diagram-placeholder" data-diagram-id="([^"]+)"><\/div>/);

  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Regular HTML content
      if (parts[i]) {
        elements.push(
          <div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: parts[i] }} />
        );
      }
    } else {
      // Diagram ID
      const diagramId = parts[i];
      const diagram = diagrams.find(d => d.id === diagramId);
      if (diagram) {
        elements.push(
          <DiagramRenderer key={diagram.id} diagram={diagram} isDarkMode={isDarkMode} />
        );
      }
    }
  }

  return <>{elements}</>;
};
