# Arquitetura do forge_diagram

Editor web (React + TypeScript + Vite) para diagramas Mermaid/PlantUML com preview em tempo real, PWA offline e export/compartilhamento sem backend.

## Diagramas
- HLD (visão macro): `docs/diagrams/hld.mmd`
- LLD (fluxo de dados): `docs/diagrams/lld-dataflow.mmd`
- Componentes/Pacotes: `docs/diagrams/components-packages.mmd`
- Classes/Tipos principais: `docs/diagrams/classes.mmd`

## Stack e runtime
- UI: React 18, Tailwind (CDN), lucide-react.
- Editor: CodeMirror 6 com lint/autocomplete.
- Diagramas: Mermaid.js local, PlantUML via servidor remoto quando detectado.
- Interação: react-zoom-pan-pinch (zoom/pan), d3 (suporte a manipulação SVG).
- Build: Vite; `index.html` expõe import map CDN para produção estática e registra service worker (manifest em `public/`).

## Camadas
- **Apresentação (components/)**: layout (Toolbar, ActivityBar, Sidebar, TabBar, MobileTabBar), edição/preview (CodeEditor, MarkdownPreview, Minimap), diálogos (Save/Load/Share/Embed/Import), explorador de arquivos (FileExplorer, FileTreeItem, SearchPanel).
- **Estado (hooks/)**: `useTabs` (abas persistidas, limite 10), `useHistory` (undo/redo de código), `useVisualHistory` (undo/redo de drag no SVG), `useActivityBar`, `useWorkspace` (File System Access API + fallback upload), `useExport`, `useDiagramStorage`, `useKeyboardShortcuts`, `useMediaQuery`.
- **Lógica (utils/)**: temas (`mermaidThemes`, `markdownThemes`), templates (`diagramTemplates`), lint/transform (`mermaidUtils`, `mermaidLinter`), import/export (`plantumlUtils`, `importUtils`, `exportUtils`, `embedUtils`), persistência (`storageUtils`, `fileSystemUtils`, `shareUtils`).
- **Persistência**: localStorage (abas, configurações, autosave, diagramas salvos), IndexedDB (handle do workspace), URL hash (código comprimido), disco local via File System Access API ou workspace virtual.

## Fluxos principais
- **Edição/preview**: Usuário edita no `CodeEditor` → `useHistory` guarda versões → `useTabs` marca `isDirty` e salva após debounce → `InnerMermaidRenderer` renderiza (Mermaid ou PlantUML remoto) → captura SVG para export/share/minimap → `useVisualHistory` registra drags para undo/redo combinado com o histórico de código.
- **Workspace**: `useWorkspace` abre pasta via `showDirectoryPicker` ou upload; lista com `FileExplorer/SearchPanel`; leitura com cache de conteúdo; escrita direta em disco ou em memória para workspaces virtuais; reabre último workspace via IndexedDB + permissões.
- **Export/Share/Embed**: `exportUtils` converte SVG → PNG/Blob; share dialog usa `shareUtils.encodeForUrl` (gzip + base64 URL-safe) para gerar hash; `embedUtils` produz iframe/HTML/Markdown; print reseta zoom e chama `window.print`.

## Persistência detalhada
- `localStorage`: `forge-draw-tabs` (abas), `mermaid-pro-viz-autosave` (autosave), `mermaid-pro-viz-settings` (configurações), `mermaid-pro-viz-diagrams` (diagramas salvos), `forge-diagram-activitybar` (sidebar).
- `IndexedDB`: `forge-draw-workspace-handle` (handle da pasta para reabrir), usado em `useWorkspace`.
- `URL`: `#code=<base64-gzip>` carregado via `shareUtils` na inicialização e em `hashchange`.
- `Disco`: leitura/escrita via File System Access API; fallback mantém conteúdo dos arquivos no nó `FileNode.content` (workspace virtual).

## Integrações externas e limites
- CodeMirror 6, Mermaid 10, PlantUML server externo, pako (compressão), react-zoom-pan-pinch, d3.
- Máx. 10 abas (`MAX_TABS`), auto-save com debounce 5s, abas distinguem `diagram`/`markdown`, drag de nós desabilita zoom temporariamente.

## PWA e UX
- Manifest + service worker para instalação offline; em dev o SW é desregistrado automaticamente.
- Modo escuro acionado adicionando `class="dark"` no `documentElement`.
- Layout responsivo: TabBar desktop; MobileTabBar alterna editor/preview; minimap opcional; fullscreen no preview.
