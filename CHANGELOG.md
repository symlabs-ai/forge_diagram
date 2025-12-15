# Changelog

Todas as mudancas notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semantico](https://semver.org/lang/pt-BR/).

## [0.3.0] - 2025-12-15

### Adicionado
- **Toolbar Contextual** - Toolbar muda conforme tipo de arquivo (diagrama vs markdown)
- **Temas Markdown** - 10 temas para preview: Default, Default Dark, GitHub, Medium, Notion, Developer Dark, Typora, Livro, Minimal, Academic
- **Open Folder via Toolbar** - Botao Open agora abre dropdown com opcoes File e Folder

### Corrigido
- **Cursor no Editor** - Corrigido bug que fazia cursor pular para inicio ao digitar
- **Blockquotes Markdown** - Simbolo `>` agora renderiza corretamente como citacao
- **Underscores em Palavras** - Texto como `admin_api_ui` nao e mais interpretado como italico
- **Code Blocks** - Blocos de codigo nao multiplicam mais linhas em branco
- **Resize do Sidebar** - Handle de resize do explorer agora funciona corretamente

## [0.2.2] - 2025-12-15

### Adicionado
- **ShareDialog** - Nova janela unificada de compartilhamento e exportacao (URL, PNG, SVG, Copy SVG, Markdown)
- **Conexao de Arestas em Diamantes** - Arestas agora conectam corretamente em nodes diamante (decisao) e circulares

### Alterado
- **Toolbar Simplificada** - Botoes PNG, SVG, MD e Copy SVG movidos para ShareDialog
- **Undo/Redo Visual** - Suporte a undo/redo para operacoes de drag de nodes via snapshots SVG

## [0.2.1] - 2025-12-13

### Adicionado
- **Atalhos de Zoom** - Ctrl+=/+ (zoom in), Ctrl+- (zoom out), Ctrl+0 (reset zoom) sobrepondo atalhos do browser
- **Botao Redraw** - Redesenha o diagrama restaurando layout original, preservando nivel de zoom atual
- **PlantUML Drag & Drop** - Arraste nodes em diagramas PlantUML com reconexao automatica de arestas

### Alterado
- Botao Reset Zoom substituido por Redraw na toolbar

## [0.2.0] - 2025-12-13

### Adicionado
- **Toolbar Mobile Simplificada** - Apenas botoes essenciais: Templates, Dark Mode, Orientacao, Zoom, Share, PNG, Copy
- **Preview Padrao no Mobile** - Aba Preview abre por padrao em dispositivos moveis
- **Deteccao de Links Compartilhados no PWA** - Links compartilhados agora funcionam corretamente no PWA instalado

### Alterado
- **Renomeado para forge Diagram** - Novo nome do projeto (antes forge Draw)

### Corrigido
- **Build Vite com Cytoscape** - Resolvido erro de modulo UMD do cytoscape durante build de producao
- **Diagrama Cortado ao Arrastar** - SVG agora usa overflow visible para nao cortar nas bordas
- **Centralizacao do Diagrama** - Diagrama permanece centralizado apos correcao de clipping
- **Cache do PWA** - Atualizada versao do cache do Service Worker para forcar refresh

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
