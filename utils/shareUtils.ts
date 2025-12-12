/**
 * URL sharing utilities for Mermaid diagrams
 * Uses pako for compression to keep URLs manageable
 */

import pako from 'pako';

/**
 * Compress and encode code for URL
 * Uses gzip compression + base64 URL-safe encoding
 */
export function encodeForUrl(code: string): string {
  try {
    const compressed = pako.deflate(code, { level: 9 });
    const base64 = btoa(String.fromCharCode(...compressed));
    // Make URL-safe
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error('Failed to encode for URL:', e);
    return '';
  }
}

/**
 * Decode and decompress code from URL
 */
export function decodeFromUrl(encoded: string): string | null {
  try {
    // Restore standard base64
    let base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }

    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const decompressed = pako.inflate(bytes);
    return new TextDecoder().decode(decompressed);
  } catch (e) {
    console.error('Failed to decode from URL:', e);
    return null;
  }
}

/**
 * Generate shareable URL with encoded diagram
 */
export function generateShareUrl(code: string): string {
  const encoded = encodeForUrl(code);
  if (!encoded) return '';

  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#code=${encoded}`;
}

/**
 * Extract code from current URL hash
 */
export function getCodeFromUrl(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/^#code=(.+)$/);

  if (!match) return null;

  return decodeFromUrl(match[1]);
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareUrl(code: string): Promise<boolean> {
  const url = generateShareUrl(code);
  if (!url) return false;

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (e) {
    console.error('Failed to copy to clipboard:', e);
    return false;
  }
}

/**
 * Update URL hash without triggering navigation
 */
export function updateUrlHash(code: string): void {
  const encoded = encodeForUrl(code);
  if (encoded) {
    const newUrl = `${window.location.pathname}#code=${encoded}`;
    window.history.replaceState(null, '', newUrl);
  }
}

/**
 * Clear URL hash
 */
export function clearUrlHash(): void {
  window.history.replaceState(null, '', window.location.pathname);
}
