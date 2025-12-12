/**
 * Mermaid diagram themes
 */

export interface MermaidThemeVariables {
  primaryColor: string;
  primaryTextColor: string;
  primaryBorderColor: string;
  lineColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  background: string;
  mainBkg: string;
  nodeBorder: string;
  clusterBkg: string;
  titleColor: string;
  edgeLabelBackground: string;
  // Sequence diagram specific
  signalColor: string;
  signalTextColor: string;
  actorLineColor: string;
  // Flowchart specific
  nodeTextColor: string;
}

export interface MermaidTheme {
  id: string;
  name: string;
  variables: Partial<MermaidThemeVariables>;
  baseTheme: 'default' | 'dark' | 'forest' | 'neutral' | 'base';
}

export const themes: MermaidTheme[] = [
  {
    id: 'default',
    name: 'Default',
    baseTheme: 'default',
    variables: {},
  },
  {
    id: 'dark',
    name: 'Dark',
    baseTheme: 'dark',
    variables: {},
  },
  {
    id: 'forest',
    name: 'Forest',
    baseTheme: 'forest',
    variables: {},
  },
  {
    id: 'neutral',
    name: 'Neutral',
    baseTheme: 'neutral',
    variables: {},
  },
  {
    id: 'ocean',
    name: 'Ocean',
    baseTheme: 'base',
    variables: {
      primaryColor: '#0077b6',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#023e8a',
      lineColor: '#023e8a',
      secondaryColor: '#90e0ef',
      tertiaryColor: '#caf0f8',
      background: '#f8fafc',
      mainBkg: '#0077b6',
      nodeBorder: '#023e8a',
      clusterBkg: '#caf0f8',
      titleColor: '#03045e',
      edgeLabelBackground: '#ffffff',
      // Sequence diagram
      signalColor: '#023e8a',
      signalTextColor: '#03045e',
      actorLineColor: '#023e8a',
      // Flowchart
      nodeTextColor: '#ffffff',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    baseTheme: 'base',
    variables: {
      primaryColor: '#ff6b35',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#d62828',
      lineColor: '#d62828',
      secondaryColor: '#fcbf49',
      tertiaryColor: '#eae2b7',
      background: '#fffbf0',
      mainBkg: '#ff6b35',
      nodeBorder: '#d62828',
      clusterBkg: '#eae2b7',
      titleColor: '#003049',
      edgeLabelBackground: '#ffffff',
      // Sequence diagram
      signalColor: '#d62828',
      signalTextColor: '#003049',
      actorLineColor: '#d62828',
      // Flowchart
      nodeTextColor: '#ffffff',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    baseTheme: 'base',
    variables: {
      primaryColor: '#7c3aed',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#5b21b6',
      lineColor: '#5b21b6',
      secondaryColor: '#c4b5fd',
      tertiaryColor: '#ede9fe',
      background: '#faf5ff',
      mainBkg: '#7c3aed',
      nodeBorder: '#5b21b6',
      clusterBkg: '#ede9fe',
      titleColor: '#4c1d95',
      edgeLabelBackground: '#ffffff',
      // Sequence diagram
      signalColor: '#5b21b6',
      signalTextColor: '#4c1d95',
      actorLineColor: '#5b21b6',
      // Flowchart
      nodeTextColor: '#ffffff',
    },
  },
  {
    id: 'mint',
    name: 'Mint',
    baseTheme: 'base',
    variables: {
      primaryColor: '#059669',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#047857',
      lineColor: '#047857',
      secondaryColor: '#6ee7b7',
      tertiaryColor: '#d1fae5',
      background: '#f0fdf4',
      mainBkg: '#059669',
      nodeBorder: '#047857',
      clusterBkg: '#d1fae5',
      titleColor: '#064e3b',
      edgeLabelBackground: '#ffffff',
      // Sequence diagram
      signalColor: '#047857',
      signalTextColor: '#064e3b',
      actorLineColor: '#047857',
      // Flowchart
      nodeTextColor: '#ffffff',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    baseTheme: 'base',
    variables: {
      primaryColor: '#374151',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#1f2937',
      lineColor: '#1f2937',
      secondaryColor: '#9ca3af',
      tertiaryColor: '#e5e7eb',
      background: '#f9fafb',
      mainBkg: '#374151',
      nodeBorder: '#1f2937',
      clusterBkg: '#e5e7eb',
      titleColor: '#111827',
      edgeLabelBackground: '#ffffff',
      // Sequence diagram
      signalColor: '#1f2937',
      signalTextColor: '#111827',
      actorLineColor: '#1f2937',
      // Flowchart
      nodeTextColor: '#ffffff',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    baseTheme: 'base',
    variables: {
      primaryColor: '#e11d48',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#be123c',
      lineColor: '#be123c',
      secondaryColor: '#fda4af',
      tertiaryColor: '#ffe4e6',
      background: '#fff1f2',
      mainBkg: '#e11d48',
      nodeBorder: '#be123c',
      clusterBkg: '#ffe4e6',
      titleColor: '#881337',
      edgeLabelBackground: '#ffffff',
      // Sequence diagram
      signalColor: '#be123c',
      signalTextColor: '#881337',
      actorLineColor: '#be123c',
      // Flowchart
      nodeTextColor: '#ffffff',
    },
  },
];

/**
 * Gera a diretiva %%{init}%% para aplicar um tema
 */
export function generateThemeDirective(theme: MermaidTheme): string {
  if (theme.baseTheme !== 'base' && Object.keys(theme.variables).length === 0) {
    // Usa tema built-in do Mermaid
    return `%%{init: {'theme': '${theme.baseTheme}'}}%%`;
  }

  // Tema customizado
  const config = {
    theme: 'base',
    themeVariables: theme.variables,
  };

  return `%%{init: ${JSON.stringify(config)}}%%`;
}

/**
 * Aplica um tema ao código Mermaid
 * Remove diretivas existentes e adiciona a nova
 */
export function applyThemeToCode(code: string, theme: MermaidTheme): string {
  // Remove diretivas %%{init}%% existentes
  const codeWithoutInit = code.replace(/%%\{init:.*?\}%%\s*/gs, '').trim();

  // Adiciona nova diretiva
  const directive = generateThemeDirective(theme);
  return `${directive}\n${codeWithoutInit}`;
}

/**
 * Obtém o tema pelo ID
 */
export function getThemeById(id: string): MermaidTheme | undefined {
  return themes.find(t => t.id === id);
}

/**
 * Obtém o tema padrão baseado no dark mode
 */
export function getDefaultTheme(isDarkMode: boolean): MermaidTheme {
  return themes.find(t => t.id === (isDarkMode ? 'dark' : 'default'))!;
}
