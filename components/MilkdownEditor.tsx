import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { history } from '@milkdown/plugin-history';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { clipboard } from '@milkdown/plugin-clipboard';
import { prism, prismConfig } from '@milkdown/plugin-prism';
import { replaceAll } from '@milkdown/utils';
import { createDiagramPlugin } from '../plugins/milkdown-diagram-plugin';
import { MarkdownTheme } from '../utils/markdownThemes';

// Import Prism core and languages
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

// Make Prism available globally for the plugin
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}

interface DiagramBlock {
  id: string;
  type: 'mermaid' | 'plantuml';
  code: string;
  index: number;
}

interface MilkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  isDarkMode: boolean;
  filePath?: string;
  onEditDiagram?: (diagram: DiagramBlock, filePath: string) => void;
  theme?: MarkdownTheme;
  spellcheck?: boolean;
}

// Custom styles for Milkdown - uses theme when provided
const getMilkdownStyles = (isDarkMode: boolean, theme?: MarkdownTheme) => {
  // Use theme styles if provided, otherwise use defaults
  const s = theme?.styles;

  // Default fallback values
  const background = s?.background ?? (isDarkMode ? '#1e293b' : '#ffffff');
  const color = s?.color ?? (isDarkMode ? '#e2e8f0' : '#1e293b');
  const fontFamily = s?.fontFamily ?? "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const fontSize = s?.fontSize ?? '1rem';
  const lineHeight = s?.lineHeight ?? '1.7';
  const h1Color = s?.h1Color ?? (isDarkMode ? '#f1f5f9' : '#0f172a');
  const h2Color = s?.h2Color ?? (isDarkMode ? '#f1f5f9' : '#0f172a');
  const h3Color = s?.h3Color ?? (isDarkMode ? '#f1f5f9' : '#0f172a');
  const headingFontFamily = s?.headingFontFamily ?? fontFamily;
  const linkColor = s?.linkColor ?? (isDarkMode ? '#60a5fa' : '#2563eb');
  const linkHoverColor = s?.linkHoverColor ?? (isDarkMode ? '#93c5fd' : '#1d4ed8');
  const codeBackground = s?.codeBackground ?? (isDarkMode ? '#374151' : '#f1f5f9');
  const codeColor = s?.codeColor ?? (isDarkMode ? '#fbbf24' : '#c026d3');
  const codeFontFamily = s?.codeFontFamily ?? "'JetBrains Mono', 'Fira Code', monospace";
  const blockquoteBorder = s?.blockquoteBorder ?? (isDarkMode ? '#4f46e5' : '#6366f1');
  const blockquoteBackground = s?.blockquoteBackground ?? (isDarkMode ? '#1e1b4b' : '#eef2ff');
  const blockquoteColor = s?.blockquoteColor ?? (isDarkMode ? '#c7d2fe' : '#4338ca');
  const tableBorder = s?.tableBorder ?? (isDarkMode ? '#374151' : '#e5e7eb');
  const tableHeaderBackground = s?.tableHeaderBackground ?? (isDarkMode ? '#1f2937' : '#f8fafc');
  const tableStripeBackground = s?.tableStripeBackground ?? (isDarkMode ? '#1e293b' : '#f8fafc');
  const hrColor = s?.hrColor ?? (isDarkMode ? '#374151' : '#e5e7eb');

  return `
  .milkdown {
    height: 100%;
    overflow-y: auto;
    padding: 1.5rem;
    font-family: ${fontFamily};
    font-size: ${fontSize};
    line-height: ${lineHeight};
    color: ${color};
    background: ${background};
  }

  .milkdown .editor {
    outline: none;
    min-height: 100%;
  }

  .milkdown .ProseMirror {
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .milkdown h1 {
    font-size: 2em;
    font-weight: 700;
    margin: 1.5rem 0 1rem;
    padding-bottom: 0.3em;
    border-bottom: 1px solid ${hrColor};
    color: ${h1Color};
    font-family: ${headingFontFamily};
  }

  .milkdown h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin: 1.25rem 0 0.75rem;
    padding-bottom: 0.25em;
    border-bottom: 1px solid ${hrColor};
    color: ${h2Color};
    font-family: ${headingFontFamily};
  }

  .milkdown h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 1rem 0 0.5rem;
    color: ${h3Color};
    font-family: ${headingFontFamily};
  }

  .milkdown h4, .milkdown h5, .milkdown h6 {
    font-weight: 600;
    margin: 0.75rem 0 0.5rem;
    color: ${h3Color};
    font-family: ${headingFontFamily};
  }

  .milkdown p {
    margin: 0.75rem 0;
  }

  .milkdown a {
    color: ${linkColor};
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .milkdown a:hover {
    color: ${linkHoverColor};
  }

  .milkdown strong {
    font-weight: 600;
    color: ${h1Color};
  }

  .milkdown em {
    font-style: italic;
  }

  .milkdown ul, .milkdown ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .milkdown ul {
    list-style-type: disc;
  }

  .milkdown ol {
    list-style-type: decimal;
  }

  .milkdown li {
    margin: 0.25rem 0;
  }

  .milkdown li > ul, .milkdown li > ol {
    margin: 0.25rem 0;
  }

  .milkdown blockquote {
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    border-left: 4px solid ${blockquoteBorder};
    background: ${blockquoteBackground};
    color: ${blockquoteColor};
    border-radius: 0 0.375rem 0.375rem 0;
  }

  .milkdown code {
    font-family: ${codeFontFamily};
    font-size: 0.875em;
    background: ${codeBackground};
    padding: 0.2em 0.4em;
    border-radius: 0.25rem;
    color: ${codeColor};
  }

  .milkdown pre {
    margin: 1rem 0;
    padding: 1rem;
    background: ${codeBackground};
    border-radius: 0.5rem;
    overflow-x: auto;
    border: 1px solid ${tableBorder};
  }

  .milkdown pre code {
    background: transparent;
    padding: 0;
    color: ${codeColor};
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .milkdown hr {
    margin: 2rem 0;
    border: none;
    border-top: 1px solid ${hrColor};
  }

  .milkdown table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    font-size: 0.9em;
  }

  .milkdown th, .milkdown td {
    padding: 0.75rem 1rem;
    border: 1px solid ${tableBorder};
    text-align: left;
  }

  .milkdown th {
    background: ${tableHeaderBackground};
    font-weight: 600;
  }

  .milkdown tr:nth-child(even) {
    background: ${tableStripeBackground};
  }

  .milkdown img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }

  .milkdown .task-list-item {
    list-style: none;
    margin-left: -1.5rem;
  }

  .milkdown .task-list-item input[type="checkbox"] {
    margin-right: 0.5rem;
  }

  /* Selection styles */
  .milkdown .ProseMirror-selectednode {
    outline: 2px solid ${linkColor};
    outline-offset: 2px;
  }

  /* Focus styles */
  .milkdown .ProseMirror:focus {
    outline: none;
  }

  /* Placeholder */
  .milkdown .ProseMirror p.is-editor-empty:first-child::before {
    content: 'Start writing...';
    color: ${blockquoteColor};
    pointer-events: none;
    float: left;
    height: 0;
  }
`;
};

// Internal editor component
const MilkdownEditorInner: React.FC<MilkdownEditorProps & { editorKey: number }> = ({
  content,
  onChange,
  isDarkMode,
  editorKey,
  filePath,
  onEditDiagram,
  theme,
  spellcheck = false,
}) => {
  const lastContentRef = useRef(content);
  const isInternalChangeRef = useRef(false);
  const isSyncingRef = useRef(true); // Start true to skip initial load; set true during external sync
  const editorRef = useRef<Editor | null>(null);

  // Use refs for callbacks to avoid recreating the editor/plugin on every render
  const onChangeRef = useRef(onChange);
  const onEditDiagramRef = useRef(onEditDiagram);
  useEffect(() => {
    onChangeRef.current = onChange;
    onEditDiagramRef.current = onEditDiagram;
  }, [onChange, onEditDiagram]);

  // Create diagram plugin with stable options (only recreate on isDarkMode/filePath change)
  const diagramPlugin = useMemo(() => createDiagramPlugin({
    isDarkMode,
    filePath,
    onEditDiagram: (diagram, fp) => onEditDiagramRef.current?.(diagram, fp),
  }), [isDarkMode, filePath]);

  const { get, loading } = useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);

        // Configure listener for changes
        ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
          // Skip durante sync externo (inicial ou de CodeMirror)
          if (isSyncingRef.current) {
            console.log('[Milkdown] Skipping onChange - syncing');
            lastContentRef.current = markdown;
            isSyncingRef.current = false; // Reset AQUI, não em timeout
            return;
          }

          // Skip se conteúdo igual
          if (markdown === lastContentRef.current) {
            return;
          }

          // User edit real
          console.log('[Milkdown] Calling onChange - user edit detected');
          isInternalChangeRef.current = true;
          lastContentRef.current = markdown;
          onChangeRef.current(markdown);
          setTimeout(() => { isInternalChangeRef.current = false; }, 50);
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .use(clipboard)
      .use(prism)
      .use(diagramPlugin);
  }, [editorKey, diagramPlugin]);

  // Store editor reference when available
  useEffect(() => {
    if (!loading) {
      editorRef.current = get();
      console.log('[Milkdown] Editor ready');
    }
  }, [get, loading]);

  // Sync external content changes to editor (from CodeMirror)
  useEffect(() => {
    const editor = editorRef.current;

    // Skip if this change originated from Milkdown itself
    if (isInternalChangeRef.current) {
      console.log('[Milkdown] Skipping sync - internal change');
      return;
    }

    // Only sync if content actually changed externally
    if (editor && content !== lastContentRef.current) {
      console.log('[Milkdown] Syncing external content change');
      isSyncingRef.current = true; // Set ANTES de replaceAll
      editor.action(replaceAll(content));
    }
  }, [content]);

  return (
    <>
      <style>{getMilkdownStyles(isDarkMode, theme)}</style>
      <div spellCheck={spellcheck} className="h-full">
        <Milkdown />
      </div>
    </>
  );
};

// Main component with provider
export const MilkdownEditor: React.FC<MilkdownEditorProps> = (props) => {
  const [editorKey, setEditorKey] = useState(0);
  const prevDarkModeRef = useRef(props.isDarkMode);
  const prevThemeRef = useRef(props.theme?.id);

  // Reinitialize editor when dark mode or theme changes
  useEffect(() => {
    if (prevDarkModeRef.current !== props.isDarkMode || prevThemeRef.current !== props.theme?.id) {
      prevDarkModeRef.current = props.isDarkMode;
      prevThemeRef.current = props.theme?.id;
      setEditorKey((k) => k + 1);
    }
  }, [props.isDarkMode, props.theme?.id]);

  return (
    <div className="h-full overflow-hidden">
      <MilkdownProvider key={editorKey}>
        <MilkdownEditorInner {...props} editorKey={editorKey} />
      </MilkdownProvider>
    </div>
  );
};

export default MilkdownEditor;
