import React, { useState, useCallback } from 'react';
import { generateShareUrl } from '../utils/shareUtils';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  isDarkMode: boolean;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportMarkdown: () => void;
  onCopySvg: () => void;
}

type ShareTab = 'url' | 'png' | 'svg' | 'copy-svg' | 'markdown';

const tabConfig: { id: ShareTab; label: string; description: string; isDownload: boolean }[] = [
  { id: 'url', label: 'URL', description: 'Compartilhe um link direto para este diagrama', isDownload: false },
  { id: 'png', label: 'PNG', description: 'Exportar como imagem PNG (ideal para documentos)', isDownload: true },
  { id: 'svg', label: 'SVG', description: 'Exportar como vetor SVG (escalavel, ideal para web)', isDownload: true },
  { id: 'copy-svg', label: 'Copiar SVG', description: 'Copiar o codigo SVG para a area de transferencia', isDownload: false },
  { id: 'markdown', label: 'MD', description: 'Exportar como Markdown (ideal para GitHub/GitLab)', isDownload: true },
];

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  code,
  isDarkMode,
  onExportPng,
  onExportSvg,
  onExportMarkdown,
  onCopySvg,
}) => {
  const [activeTab, setActiveTab] = useState<ShareTab>('url');
  const [copied, setCopied] = useState(false);
  const [svgCopied, setSvgCopied] = useState(false);

  const shareUrl = generateShareUrl(code);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }, [shareUrl]);

  const handleCopySvg = useCallback(() => {
    onCopySvg();
    setSvgCopied(true);
    setTimeout(() => setSvgCopied(false), 2000);
  }, [onCopySvg]);

  const handleExport = useCallback((tab: ShareTab) => {
    switch (tab) {
      case 'png':
        onExportPng();
        onClose();
        break;
      case 'svg':
        onExportSvg();
        onClose();
        break;
      case 'markdown':
        onExportMarkdown();
        onClose();
        break;
      case 'copy-svg':
        handleCopySvg();
        break;
    }
  }, [onExportPng, onExportSvg, onExportMarkdown, onClose, handleCopySvg]);

  if (!isOpen) return null;

  const activeConfig = tabConfig.find(t => t.id === activeTab)!;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-lg mx-4 rounded-lg shadow-xl ${
          isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Compartilhar & Exportar
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Format Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {activeConfig.description}
          </p>

          {activeTab === 'url' ? (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className={`w-full p-3 pr-24 rounded-lg text-sm font-mono ${
                    isDarkMode ? 'bg-slate-900 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopyUrl}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm rounded ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Este link contem o diagrama codificado e pode ser compartilhado diretamente.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className={`p-4 rounded-full mb-4 ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
              }`}>
                {activeTab === 'png' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {activeTab === 'svg' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                )}
                {activeTab === 'copy-svg' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
                {activeTab === 'markdown' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <button
                onClick={() => handleExport(activeTab)}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  activeTab === 'copy-svg' && svgCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                {activeConfig.isDownload ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                )}
                {activeTab === 'copy-svg'
                  ? (svgCopied ? 'Copiado!' : 'Copiar SVG')
                  : `Baixar ${activeConfig.label}`
                }
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
