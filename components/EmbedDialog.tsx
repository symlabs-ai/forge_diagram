import React, { useState, useCallback } from 'react';
import { EmbedFormat, getAllEmbedFormats } from '../utils/embedUtils';

interface EmbedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  isDarkMode: boolean;
}

const formatLabels: Record<EmbedFormat, string> = {
  iframe: 'iFrame',
  html: 'HTML',
  markdown: 'Markdown',
};

const formatDescriptions: Record<EmbedFormat, string> = {
  iframe: 'Incorporar via iframe (requer hospedagem)',
  html: 'HTML com script Mermaid',
  markdown: 'Bloco de codigo Markdown',
};

export const EmbedDialog: React.FC<EmbedDialogProps> = ({
  isOpen,
  onClose,
  code,
  isDarkMode,
}) => {
  const [activeFormat, setActiveFormat] = useState<EmbedFormat>('markdown');
  const [copied, setCopied] = useState(false);

  const embedCodes = getAllEmbedFormats(code);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCodes[activeFormat]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }, [embedCodes, activeFormat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-2xl mx-4 rounded-lg shadow-xl ${
          isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Embed Diagram</h2>
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
          {(Object.keys(formatLabels) as EmbedFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => setActiveFormat(format)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeFormat === format
                  ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {formatLabels[format]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {formatDescriptions[activeFormat]}
          </p>

          <div className="relative">
            <pre
              className={`p-4 rounded-lg text-sm font-mono overflow-auto max-h-64 ${
                isDarkMode ? 'bg-slate-900' : 'bg-gray-100'
              }`}
            >
              <code>{embedCodes[activeFormat]}</code>
            </pre>

            <button
              onClick={handleCopy}
              className={`absolute top-2 right-2 px-3 py-1.5 text-sm rounded ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
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
