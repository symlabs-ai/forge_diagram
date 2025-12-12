import { useCallback, useState } from 'react';
import {
  downloadPng,
  downloadSvg,
  downloadMarkdown,
  copySvgToClipboard,
  getTimestampedFilename,
} from '../utils/exportUtils';

interface UseExportOptions {
  getSvgContent: () => string | null;
  getCode: () => string;
  onPrint: () => void;
}

interface UseExportReturn {
  exportPng: () => Promise<void>;
  exportSvg: () => void;
  exportMarkdown: () => void;
  exportPdf: () => void;
  copySvg: () => Promise<boolean>;
  isExporting: boolean;
  exportError: string | null;
}

export function useExport({ getSvgContent, getCode, onPrint }: UseExportOptions): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPng = useCallback(async () => {
    const svgContent = getSvgContent();
    if (!svgContent) {
      setExportError('No diagram to export');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const filename = getTimestampedFilename('mermaid-diagram', 'png');
      await downloadPng(svgContent, filename);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export PNG');
    } finally {
      setIsExporting(false);
    }
  }, [getSvgContent]);

  const exportSvg = useCallback(() => {
    const svgContent = getSvgContent();
    if (!svgContent) {
      setExportError('No diagram to export');
      return;
    }

    setExportError(null);
    const filename = getTimestampedFilename('mermaid-diagram', 'svg');
    downloadSvg(svgContent, filename);
  }, [getSvgContent]);

  const exportMarkdown = useCallback(() => {
    const code = getCode();
    if (!code.trim()) {
      setExportError('No diagram to export');
      return;
    }

    setExportError(null);
    const filename = getTimestampedFilename('mermaid-diagram', 'md');
    downloadMarkdown(code, filename);
  }, [getCode]);

  const exportPdf = useCallback(() => {
    onPrint();
  }, [onPrint]);

  const copySvg = useCallback(async (): Promise<boolean> => {
    const svgContent = getSvgContent();
    if (!svgContent) {
      setExportError('No diagram to copy');
      return false;
    }

    setExportError(null);
    const success = await copySvgToClipboard(svgContent);
    if (!success) {
      setExportError('Failed to copy to clipboard');
    }
    return success;
  }, [getSvgContent]);

  return {
    exportPng,
    exportSvg,
    exportMarkdown,
    exportPdf,
    copySvg,
    isExporting,
    exportError,
  };
}
