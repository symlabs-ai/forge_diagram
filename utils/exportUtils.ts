/**
 * Export utilities for Mermaid diagrams
 */

/**
 * Convert SVG string to PNG blob using Canvas API
 */
export async function svgToPng(svgString: string, scale = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svg);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get canvas context'));
        return;
      }

      // White background for PNG
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create PNG blob'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load SVG image'));
    };

    img.src = url;
  });
}

/**
 * Trigger download of a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download SVG as file
 */
export function downloadSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Download PNG from SVG
 */
export async function downloadPng(svgString: string, filename: string, scale = 2): Promise<void> {
  const blob = await svgToPng(svgString, scale);
  downloadBlob(blob, filename);
}

/**
 * Copy SVG to clipboard as text
 */
export async function copySvgToClipboard(svgString: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(svgString);
    return true;
  } catch (err) {
    console.error('Failed to copy SVG to clipboard:', err);
    return false;
  }
}

/**
 * Get filename with timestamp
 */
export function getTimestampedFilename(baseName: string, extension: string): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `${baseName}-${timestamp}.${extension}`;
}
