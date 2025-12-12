# Changelog

Todas as mudancas notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semantico](https://semver.org/lang/pt-BR/).

## [0.1.1] - 2025-12-12

### Adicionado
- **URL Compartilhavel** - Compartilhe diagramas via URL com compressao pako
- **Embed Code** - Gere codigo para iframe, HTML ou Markdown
- **Export Markdown** - Exporte diagramas como arquivo .md
- **Design Responsivo** - Interface adaptada para mobile com tab bar
- **PWA Offline** - Service Worker para funcionamento offline
- **Multiplas Abas** - Trabalhe com ate 10 diagramas simultaneamente
- **Import** - Importe diagramas de PlantUML e draw.io
- **Logo "forge Diagram"** - Branding na toolbar

### Corrigido
- Setas desaparecendo no tema Sunset (sequence diagrams)
- Cor do texto errada em nodes de flowchart (nodeTextColor)

## [0.1.0] - 2025-12-11

### Adicionado
- Editor CodeMirror com syntax highlighting
- Preview em tempo real com Mermaid.js
- Temas: Default, Dark, Forest, Neutral, Ocean, Sunset, Lavender, Mint, Monochrome, Rose
- Templates: Flowchart, Sequence, Class, ER, State, Gantt, Pie, Mindmap
- Drag & Drop para reorganizar nodes
- Zoom e Pan com minimap
- Export para PNG, SVG, PDF
- Undo/Redo com historico
- Auto-save no localStorage
- Dark mode
- Fullscreen mode
- Paineis redimensionaveis
- Edicao inline de nodes (double-click)
- Atalhos de teclado (Ctrl+S, Ctrl+Z, Ctrl+Y, F11)
