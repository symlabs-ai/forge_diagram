import { Orientation } from '../types';

export const INITIAL_CODE = `graph TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]
`;

export const detectOrientation = (code: string): Orientation => {
  // Normalizar espaços e quebras de linha
  const normalizedCode = code.replace(/\r\n/g, '\n');

  // Detecta orientação horizontal (LR ou RL)
  if (
    /\b(graph|flowchart|diagram)\s+LR\b/i.test(normalizedCode) ||
    /\bdirection\s+LR\b/i.test(normalizedCode)
  ) {
    return 'LR';
  }
  if (
    /\b(graph|flowchart|diagram)\s+RL\b/i.test(normalizedCode) ||
    /\bdirection\s+RL\b/i.test(normalizedCode)
  ) {
    return 'LR'; // RL também é horizontal
  }
  return 'TD';
};

export const toggleOrientationInCode = (code: string, currentOrientation: Orientation): string => {
  if (currentOrientation === 'TD') {
    return code
      .replace(/\bgraph\s+(TD|TB)\b/gi, 'graph LR')
      .replace(/\bflowchart\s+(TD|TB)\b/gi, 'flowchart LR')
      .replace(/\bdiagram\s+(TD|TB)\b/gi, 'diagram LR')
      .replace(/\bdirection\s+(TD|TB)\b/gi, 'direction LR');
  } else {
    return code
      .replace(/\bgraph\s+(LR|RL)\b/gi, 'graph TD')
      .replace(/\bflowchart\s+(LR|RL)\b/gi, 'flowchart TD')
      .replace(/\bdiagram\s+(LR|RL)\b/gi, 'diagram TD')
      .replace(/\bdirection\s+(LR|RL)\b/gi, 'direction TD');
  }
};
