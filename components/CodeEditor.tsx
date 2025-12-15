import React, { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, highlightSpecialChars } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, undo, redo } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { tags } from '@lezer/highlight';
import { HighlightStyle } from '@codemirror/language';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  error: string | null;
  isDarkMode: boolean;
}

// Mermaid syntax validation usando a API do mermaid
const createMermaidLinter = () => {
  return linter(async (view): Promise<Diagnostic[]> => {
    const code = view.state.doc.toString();
    if (!code.trim()) return [];

    try {
      const mermaid = await import('mermaid');
      await mermaid.default.parse(code);
      return [];
    } catch (e: any) {
      // Tenta extrair posição do erro se disponível
      const message = e.message || 'Syntax error';
      return [{
        from: 0,
        to: Math.min(code.length, 50),
        severity: 'error',
        message: message.split('\n')[0], // Primeira linha do erro
      }];
    }
  }, {
    delay: 500, // Debounce de 500ms
  });
};

// Tema claro customizado
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#1e293b',
  },
  '.cm-content': {
    caretColor: '#1e293b',
  },
  '.cm-cursor': {
    borderLeftColor: '#1e293b',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: '#dbeafe',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    borderRight: '1px solid #e2e8f0',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e2e8f0',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
  },
}, { dark: false });

// Tema escuro customizado
const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
  },
  '.cm-content': {
    caretColor: '#e2e8f0',
  },
  '.cm-cursor': {
    borderLeftColor: '#e2e8f0',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: '#334155',
  },
  '.cm-gutters': {
    backgroundColor: '#1e293b',
    color: '#64748b',
    borderRight: '1px solid #334155',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#334155',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
  },
}, { dark: true });

// Syntax highlighting para Mermaid (simplificado)
const mermaidHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#8b5cf6' }, // purple para keywords
  { tag: tags.string, color: '#22c55e' }, // green para strings
  { tag: tags.comment, color: '#64748b', fontStyle: 'italic' }, // gray para comentários
  { tag: tags.number, color: '#f59e0b' }, // amber para números
  { tag: tags.operator, color: '#ec4899' }, // pink para operadores
  { tag: tags.punctuation, color: '#94a3b8' }, // gray para pontuação
  { tag: tags.variableName, color: '#3b82f6' }, // blue para variáveis
  { tag: tags.typeName, color: '#06b6d4' }, // cyan para tipos
]);

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onUndo,
  onRedo,
  onSave,
  error,
  isDarkMode,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInternalChange = useRef(false);

  // Refs para callbacks para evitar recriação do editor
  const onChangeRef = useRef(onChange);
  const onUndoRef = useRef(onUndo);
  const onRedoRef = useRef(onRedo);
  const onSaveRef = useRef(onSave);

  // Atualiza refs quando callbacks mudam
  useEffect(() => {
    onChangeRef.current = onChange;
    onUndoRef.current = onUndo;
    onRedoRef.current = onRedo;
    onSaveRef.current = onSave;
  }, [onChange, onUndo, onRedo, onSave]);

  // Callback quando o conteúdo muda - usa ref para não recriar
  const handleChange = useCallback((update: any) => {
    if (update.docChanged && !isInternalChange.current) {
      const newCode = update.state.doc.toString();
      onChangeRef.current(newCode);
    }
  }, []);

  // Cria as extensões do editor
  const createExtensions = useCallback(() => {
    const customKeymap = keymap.of([
      // Ctrl+S para salvar
      {
        key: 'Mod-s',
        run: () => {
          onSaveRef.current?.();
          return true;
        },
        preventDefault: true,
      },
      // Ctrl+Z para undo (usa o do app se disponível)
      {
        key: 'Mod-z',
        run: (view) => {
          if (onUndoRef.current) {
            onUndoRef.current();
            return true;
          }
          return undo(view);
        },
      },
      // Ctrl+Y ou Ctrl+Shift+Z para redo
      {
        key: 'Mod-y',
        run: (view) => {
          if (onRedoRef.current) {
            onRedoRef.current();
            return true;
          }
          return redo(view);
        },
      },
      {
        key: 'Mod-Shift-z',
        run: (view) => {
          if (onRedoRef.current) {
            onRedoRef.current();
            return true;
          }
          return redo(view);
        },
      },
    ]);

    return [
      // Funcionalidades básicas
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      rectangularSelection(),
      highlightActiveLine(),
      bracketMatching(),
      highlightSelectionMatches(),

      // Keymaps
      customKeymap,
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...searchKeymap,
      ]),

      // Syntax highlighting
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      syntaxHighlighting(mermaidHighlightStyle),

      // Linting
      lintGutter(),
      createMermaidLinter(),

      // Tema
      isDarkMode ? darkTheme : lightTheme,

      // Line wrapping
      EditorView.lineWrapping,

      // Update listener
      EditorView.updateListener.of(handleChange),
    ];
  }, [isDarkMode, handleChange]);

  // Inicializa o editor
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: code,
      extensions: createExtensions(),
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Só executa uma vez na montagem

  // Atualiza o tema quando isDarkMode muda
  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const currentCode = view.state.doc.toString();

    // Recria o estado com as novas extensões
    const newState = EditorState.create({
      doc: currentCode,
      extensions: createExtensions(),
    });

    view.setState(newState);
  }, [isDarkMode, createExtensions]);

  // Sincroniza código externo (quando o código muda de fora do editor)
  // Só atualiza se o código realmente mudou E não foi uma mudança interna
  const lastExternalCode = useRef(code);

  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const currentCode = view.state.doc.toString();

    // Só sincroniza se:
    // 1. O código externo mudou em relação ao último código externo conhecido
    // 2. E o código externo é diferente do que está no editor
    // Isso evita re-sincronizar quando a mudança veio do próprio editor
    if (code !== lastExternalCode.current && code !== currentCode) {
      console.log('[CodeEditor] External code changed, syncing...');
      isInternalChange.current = true;

      // Preserva a posição do cursor se possível
      const cursorPos = view.state.selection.main.head;
      const newCursorPos = Math.min(cursorPos, code.length);

      view.dispatch({
        changes: {
          from: 0,
          to: currentCode.length,
          insert: code,
        },
        selection: { anchor: newCursorPos },
      });
      isInternalChange.current = false;
    }

    lastExternalCode.current = code;
  }, [code]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={editorRef}
        className={`flex-grow rounded-md overflow-hidden border ${
          isDarkMode
            ? 'border-slate-600 bg-slate-800'
            : 'border-gray-300 bg-white'
        } ${error ? 'border-red-500' : ''}`}
      />
      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};
