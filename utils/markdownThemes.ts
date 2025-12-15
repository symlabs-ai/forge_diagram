// Markdown preview themes for different reading experiences

export interface MarkdownTheme {
  id: string;
  name: string;
  styles: {
    // Container
    background: string;
    color: string;
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    maxWidth: string;
    // Headings
    h1Color: string;
    h2Color: string;
    h3Color: string;
    headingFontFamily: string;
    // Links
    linkColor: string;
    linkHoverColor: string;
    // Code
    codeBackground: string;
    codeColor: string;
    codeFontFamily: string;
    // Blockquote
    blockquoteBorder: string;
    blockquoteBackground: string;
    blockquoteColor: string;
    // Table
    tableBorder: string;
    tableHeaderBackground: string;
    tableStripeBackground: string;
    // HR
    hrColor: string;
  };
}

export const markdownThemes: MarkdownTheme[] = [
  {
    id: 'default',
    name: 'Default',
    styles: {
      background: '#ffffff',
      color: '#111827',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      maxWidth: '100%',
      h1Color: '#111827',
      h2Color: '#111827',
      h3Color: '#111827',
      headingFontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      linkColor: '#2563eb',
      linkHoverColor: '#1d4ed8',
      codeBackground: '#e5e7eb',
      codeColor: '#111827',
      codeFontFamily: '"JetBrains Mono", monospace',
      blockquoteBorder: '#d1d5db',
      blockquoteBackground: '#f3f4f6',
      blockquoteColor: '#6b7280',
      tableBorder: '#e5e7eb',
      tableHeaderBackground: '#f3f4f6',
      tableStripeBackground: '#f9fafb',
      hrColor: '#e5e7eb',
    },
  },
  {
    id: 'default-dark',
    name: 'Default Dark',
    styles: {
      background: '#1e293b',
      color: '#f3f4f6',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      maxWidth: '100%',
      h1Color: '#f3f4f6',
      h2Color: '#f3f4f6',
      h3Color: '#f3f4f6',
      headingFontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      linkColor: '#60a5fa',
      linkHoverColor: '#93c5fd',
      codeBackground: '#374151',
      codeColor: '#f3f4f6',
      codeFontFamily: '"JetBrains Mono", monospace',
      blockquoteBorder: '#4b5563',
      blockquoteBackground: '#1f2937',
      blockquoteColor: '#9ca3af',
      tableBorder: '#374151',
      tableHeaderBackground: '#1f2937',
      tableStripeBackground: '#111827',
      hrColor: '#374151',
    },
  },
  {
    id: 'github',
    name: 'GitHub',
    styles: {
      background: '#ffffff',
      color: '#24292f',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      maxWidth: '900px',
      h1Color: '#1f2328',
      h2Color: '#1f2328',
      h3Color: '#1f2328',
      headingFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      linkColor: '#0969da',
      linkHoverColor: '#0550ae',
      codeBackground: 'rgba(175,184,193,0.2)',
      codeColor: '#1f2328',
      codeFontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      blockquoteBorder: '#d0d7de',
      blockquoteBackground: 'transparent',
      blockquoteColor: '#656d76',
      tableBorder: '#d0d7de',
      tableHeaderBackground: '#f6f8fa',
      tableStripeBackground: '#f6f8fa',
      hrColor: '#d0d7de',
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    styles: {
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      maxWidth: '900px',
      h1Color: '#c9d1d9',
      h2Color: '#c9d1d9',
      h3Color: '#c9d1d9',
      headingFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      linkColor: '#58a6ff',
      linkHoverColor: '#79c0ff',
      codeBackground: 'rgba(110,118,129,0.4)',
      codeColor: '#c9d1d9',
      codeFontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      blockquoteBorder: '#3b434b',
      blockquoteBackground: 'transparent',
      blockquoteColor: '#8b949e',
      tableBorder: '#30363d',
      tableHeaderBackground: '#161b22',
      tableStripeBackground: '#161b22',
      hrColor: '#21262d',
    },
  },
  {
    id: 'medium',
    name: 'Medium',
    styles: {
      background: '#ffffff',
      color: '#292929',
      fontFamily: 'charter, Georgia, Cambria, "Times New Roman", Times, serif',
      fontSize: '18px',
      lineHeight: '1.8',
      maxWidth: '680px',
      h1Color: '#292929',
      h2Color: '#292929',
      h3Color: '#292929',
      headingFontFamily: 'sohne, "Helvetica Neue", Helvetica, Arial, sans-serif',
      linkColor: '#1a8917',
      linkHoverColor: '#0f730c',
      codeBackground: '#f2f2f2',
      codeColor: '#292929',
      codeFontFamily: 'Menlo, Monaco, "Courier New", monospace',
      blockquoteBorder: '#292929',
      blockquoteBackground: 'transparent',
      blockquoteColor: '#757575',
      tableBorder: '#e6e6e6',
      tableHeaderBackground: '#f9f9f9',
      tableStripeBackground: '#fafafa',
      hrColor: '#e6e6e6',
    },
  },
  {
    id: 'notion',
    name: 'Notion',
    styles: {
      background: '#ffffff',
      color: '#37352f',
      fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: '16px',
      lineHeight: '1.7',
      maxWidth: '900px',
      h1Color: '#37352f',
      h2Color: '#37352f',
      h3Color: '#37352f',
      headingFontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      linkColor: '#37352f',
      linkHoverColor: '#2eaadc',
      codeBackground: 'rgba(135,131,120,0.15)',
      codeColor: '#eb5757',
      codeFontFamily: 'SFMono-Regular, Menlo, Consolas, "PT Mono", "Liberation Mono", monospace',
      blockquoteBorder: '#000000',
      blockquoteBackground: 'transparent',
      blockquoteColor: '#6b6b6b',
      tableBorder: '#e9e9e7',
      tableHeaderBackground: '#f7f6f3',
      tableStripeBackground: '#fbfbfa',
      hrColor: '#e9e9e7',
    },
  },
  {
    id: 'notion-dark',
    name: 'Notion Dark',
    styles: {
      background: '#191919',
      color: '#e6e6e6',
      fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      fontSize: '16px',
      lineHeight: '1.7',
      maxWidth: '900px',
      h1Color: '#e6e6e6',
      h2Color: '#e6e6e6',
      h3Color: '#e6e6e6',
      headingFontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      linkColor: '#529cca',
      linkHoverColor: '#6cb8e6',
      codeBackground: 'rgba(135,131,120,0.3)',
      codeColor: '#eb5757',
      codeFontFamily: 'SFMono-Regular, Menlo, Consolas, "PT Mono", "Liberation Mono", monospace',
      blockquoteBorder: '#4a4a4a',
      blockquoteBackground: 'transparent',
      blockquoteColor: '#999999',
      tableBorder: '#2f2f2f',
      tableHeaderBackground: '#252525',
      tableStripeBackground: '#1f1f1f',
      hrColor: '#2f2f2f',
    },
  },
  {
    id: 'typora',
    name: 'Typora',
    styles: {
      background: '#ffffff',
      color: '#333333',
      fontFamily: '"Open Sans", "Clear Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6',
      maxWidth: '860px',
      h1Color: '#333333',
      h2Color: '#333333',
      h3Color: '#333333',
      headingFontFamily: '"PT Serif", Georgia, Times, serif',
      linkColor: '#4183c4',
      linkHoverColor: '#4183c4',
      codeBackground: '#f3f4f4',
      codeColor: '#333333',
      codeFontFamily: 'Consolas, "Liberation Mono", Courier, monospace',
      blockquoteBorder: '#dfe2e5',
      blockquoteBackground: 'transparent',
      blockquoteColor: '#777777',
      tableBorder: '#dfe2e5',
      tableHeaderBackground: '#f6f8fa',
      tableStripeBackground: '#f9f9f9',
      hrColor: '#dfe2e5',
    },
  },
  {
    id: 'developer-dark',
    name: 'Developer Dark',
    styles: {
      background: '#1e1e1e',
      color: '#d4d4d4',
      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, "Courier New", monospace',
      fontSize: '14px',
      lineHeight: '1.7',
      maxWidth: '1000px',
      h1Color: '#569cd6',
      h2Color: '#4ec9b0',
      h3Color: '#dcdcaa',
      headingFontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
      linkColor: '#569cd6',
      linkHoverColor: '#9cdcfe',
      codeBackground: '#2d2d2d',
      codeColor: '#ce9178',
      codeFontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
      blockquoteBorder: '#569cd6',
      blockquoteBackground: '#252526',
      blockquoteColor: '#808080',
      tableBorder: '#3c3c3c',
      tableHeaderBackground: '#252526',
      tableStripeBackground: '#2a2a2a',
      hrColor: '#3c3c3c',
    },
  },
  {
    id: 'book',
    name: 'Livro',
    styles: {
      background: '#f5f1e8',
      color: '#3d3d3d',
      fontFamily: 'Georgia, "Times New Roman", Times, serif',
      fontSize: '18px',
      lineHeight: '1.9',
      maxWidth: '650px',
      h1Color: '#2c2c2c',
      h2Color: '#2c2c2c',
      h3Color: '#2c2c2c',
      headingFontFamily: '"Playfair Display", Georgia, serif',
      linkColor: '#8b4513',
      linkHoverColor: '#a0522d',
      codeBackground: '#ebe6db',
      codeColor: '#6b4423',
      codeFontFamily: '"Courier Prime", "Courier New", monospace',
      blockquoteBorder: '#c9b99a',
      blockquoteBackground: 'rgba(201, 185, 154, 0.1)',
      blockquoteColor: '#5a5a5a',
      tableBorder: '#d4c9b5',
      tableHeaderBackground: '#ebe6db',
      tableStripeBackground: '#f0ece3',
      hrColor: '#c9b99a',
    },
  },
];

export const defaultMarkdownTheme = markdownThemes[0]; // GitHub

export function getMarkdownThemeById(id: string): MarkdownTheme {
  return markdownThemes.find(t => t.id === id) || defaultMarkdownTheme;
}

// Generate CSS from theme
export function generateMarkdownCSS(theme: MarkdownTheme): string {
  const s = theme.styles;
  return `
    .markdown-preview-themed {
      background: ${s.background};
      color: ${s.color};
      font-family: ${s.fontFamily};
      font-size: ${s.fontSize};
      line-height: ${s.lineHeight};
      padding: 2rem;
    }

    .markdown-preview-themed .markdown-content {
      max-width: ${s.maxWidth};
      margin: 0 auto;
    }

    .markdown-preview-themed h1 {
      color: ${s.h1Color};
      font-family: ${s.headingFontFamily};
      font-size: 2em;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid ${s.hrColor};
    }

    .markdown-preview-themed h2 {
      color: ${s.h2Color};
      font-family: ${s.headingFontFamily};
      font-size: 1.5em;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid ${s.hrColor};
    }

    .markdown-preview-themed h3 {
      color: ${s.h3Color};
      font-family: ${s.headingFontFamily};
      font-size: 1.25em;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    .markdown-preview-themed h4,
    .markdown-preview-themed h5,
    .markdown-preview-themed h6 {
      color: ${s.h3Color};
      font-family: ${s.headingFontFamily};
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    .markdown-preview-themed a {
      color: ${s.linkColor};
      text-decoration: none;
    }

    .markdown-preview-themed a:hover {
      color: ${s.linkHoverColor};
      text-decoration: underline;
    }

    .markdown-preview-themed code {
      background: ${s.codeBackground};
      color: ${s.codeColor};
      font-family: ${s.codeFontFamily};
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .markdown-preview-themed pre {
      background: ${s.codeBackground};
      padding: 1em;
      border-radius: 6px;
      overflow-x: auto;
    }

    .markdown-preview-themed pre code {
      background: transparent;
      padding: 0;
      font-size: 0.875em;
    }

    .markdown-preview-themed blockquote {
      border-left: 4px solid ${s.blockquoteBorder};
      background: ${s.blockquoteBackground};
      color: ${s.blockquoteColor};
      margin: 1em 0;
      padding: 0.5em 1em;
    }

    .markdown-preview-themed blockquote p {
      margin: 0;
    }

    .markdown-preview-themed table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }

    .markdown-preview-themed th,
    .markdown-preview-themed td {
      border: 1px solid ${s.tableBorder};
      padding: 0.5em 1em;
      text-align: left;
    }

    .markdown-preview-themed th {
      background: ${s.tableHeaderBackground};
      font-weight: 600;
    }

    .markdown-preview-themed tr:nth-child(even) {
      background: ${s.tableStripeBackground};
    }

    .markdown-preview-themed hr {
      border: none;
      border-top: 1px solid ${s.hrColor};
      margin: 2em 0;
    }

    .markdown-preview-themed ul,
    .markdown-preview-themed ol {
      padding-left: 2em;
      margin: 1em 0;
    }

    .markdown-preview-themed li {
      margin: 0.25em 0;
    }

    .markdown-preview-themed p {
      margin: 1em 0;
    }

    .markdown-preview-themed img {
      max-width: 100%;
      height: auto;
    }
  `;
}
