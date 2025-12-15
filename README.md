# forge Diagram

Editor profissional de diagramas Mermaid com preview em tempo real, temas customizados e suporte offline.

![forge Diagram](https://img.shields.io/badge/version-0.3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Editor com Syntax Highlighting** - CodeMirror com autocomplete e linting
- **Preview em Tempo Real** - Renderiza diagramas instantaneamente
- **Temas Customizados** - Default, Dark, Forest, Ocean, Sunset, Lavender, Mint, Rose
- **Templates** - Flowchart, Sequence, Class, ER, State, Gantt, Pie, Mindmap
- **Drag & Drop** - Arraste nodes para reorganizar diagramas
- **Zoom & Pan** - Navegue por diagramas grandes com minimap
- **Export** - PNG, SVG, Markdown, PDF (print)
- **Share** - URL compartilhavel com compressao
- **Embed** - Codigo para iframe, HTML ou Markdown
- **Import** - PlantUML e draw.io
- **Multiplas Abas** - Ate 10 diagramas simultaneos
- **PWA** - Instalavel e funciona offline
- **Responsive** - Funciona em mobile

## Quick Start

```bash
# Instalar dependencias
npm install

# Rodar em desenvolvimento
npm run dev

# Build para producao
npm run build
```

## Deploy

### Servidor Linux (nginx)

```bash
# Build
npm run build

# Copiar dist/ para /var/www/seu-site
# Configurar nginx para servir arquivos estaticos
```

Ver [guia completo de deploy](docs/DEPLOY.md) (em breve).

## Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Editor**: CodeMirror 6
- **Diagramas**: Mermaid.js
- **Zoom**: react-zoom-pan-pinch
- **Compressao**: pako

## Licenca

MIT

---

Desenvolvido por [Symlabs AI](https://github.com/symlabs-ai)
