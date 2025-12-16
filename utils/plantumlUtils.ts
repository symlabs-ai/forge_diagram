/**
 * PlantUML utilities for encoding and rendering via public server
 * Uses the official PlantUML server: https://www.plantuml.com/plantuml
 */

import pako from 'pako';

/**
 * PlantUML uses a custom encoding (similar to base64 but different alphabet)
 * Based on: https://plantuml.com/text-encoding
 */
function encode6bit(b: number): string {
  if (b < 10) return String.fromCharCode(48 + b); // 0-9
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b); // A-Z
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b); // a-z
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function append3bytes(b1: number, b2: number, b3: number): string {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return encode6bit(c1 & 0x3F) + encode6bit(c2 & 0x3F) + encode6bit(c3 & 0x3F) + encode6bit(c4 & 0x3F);
}

/**
 * Encode PlantUML text to the format expected by the server
 * Uses deflate compression + PlantUML's custom base64 encoding
 */
export function encodePlantUML(text: string): string {
  try {
    // Deflate the text using pako (raw deflate, not gzip)
    const deflated = pako.deflateRaw(text, { level: 9 });

    // Convert to PlantUML's custom base64 encoding
    let result = '';
    for (let i = 0; i < deflated.length; i += 3) {
      if (i + 2 === deflated.length) {
        result += append3bytes(deflated[i], deflated[i + 1], 0);
      } else if (i + 1 === deflated.length) {
        result += append3bytes(deflated[i], 0, 0);
      } else {
        result += append3bytes(deflated[i], deflated[i + 1], deflated[i + 2]);
      }
    }
    return result;
  } catch (e) {
    console.error('Failed to encode PlantUML:', e);
    return '';
  }
}

/**
 * Alternative simpler encoding using hex (works but creates longer URLs)
 */
export function encodePlantUMLHex(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  return '~h' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PlantUML server URL for SVG output
 * Uses deflate compression for shorter URLs that work with large diagrams
 */
export function getPlantUMLServerUrl(code: string, format: 'svg' | 'png' = 'svg'): string {
  const encoded = encodePlantUML(code);
  return `https://www.plantuml.com/plantuml/${format}/${encoded}`;
}

/**
 * Fetch SVG from PlantUML server
 */
export async function renderPlantUML(code: string): Promise<string> {
  const url = getPlantUMLServerUrl(code, 'svg');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`PlantUML server error: ${response.status}`);
    }
    const svg = await response.text();
    return svg;
  } catch (e) {
    console.error('Failed to render PlantUML:', e);
    throw e;
  }
}

/**
 * Detect if code is PlantUML
 */
export function isPlantUML(code: string): boolean {
  const trimmed = code.trim().toLowerCase();
  return trimmed.startsWith('@startuml') ||
         trimmed.startsWith('@startmindmap') ||
         trimmed.startsWith('@startwbs') ||
         trimmed.startsWith('@startgantt') ||
         trimmed.startsWith('@startjson') ||
         trimmed.startsWith('@startyaml') ||
         trimmed.startsWith('@startsalt') ||
         trimmed.startsWith('@startditaa');
}

/**
 * Get diagram type from PlantUML code
 */
export function getPlantUMLType(code: string): string {
  const match = code.trim().match(/^@start(\w+)/i);
  return match ? match[1].toLowerCase() : 'uml';
}
