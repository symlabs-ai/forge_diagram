import React, { useState, useCallback } from 'react';
import { importDiagram, ImportResult, ImportFormat, detectFormat } from '../utils/importUtils';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (code: string) => void;
  isDarkMode: boolean;
}

const formatNames: Record<ImportFormat, string> = {
  plantuml: 'PlantUML',
  drawio: 'draw.io',
  unknown: 'Unknown',
};

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport,
  isDarkMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<ImportFormat>('unknown');

  const handleInputChange = useCallback((value: string) => {
    setInputText(value);
    if (value.trim()) {
      const format = detectFormat(value);
      setDetectedFormat(format);
    } else {
      setDetectedFormat('unknown');
      setResult(null);
    }
  }, []);

  const handlePreview = useCallback(() => {
    if (!inputText.trim()) return;
    const importResult = importDiagram(inputText);
    setResult(importResult);
  }, [inputText]);

  const handleImport = useCallback(() => {
    if (result) {
      onImport(result.code);
      handleClose();
    }
  }, [result, onImport]);

  const handleClose = useCallback(() => {
    setInputText('');
    setResult(null);
    setDetectedFormat('unknown');
    onClose();
  }, [onClose]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleInputChange(content);
      };
      reader.readAsText(file);
    }
  }, [handleInputChange]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-3xl mx-4 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold">Import Diagram</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PlantUML, draw.io XML
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Input area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Paste or upload diagram code:
              </label>
              <div className="flex items-center gap-2">
                {detectedFormat !== 'unknown' && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    Detected: {formatNames[detectedFormat]}
                  </span>
                )}
                <input
                  type="file"
                  accept=".puml,.plantuml,.xml,.drawio"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className={`text-xs px-2 py-1 rounded cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Upload File
                </label>
              </div>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste PlantUML or draw.io XML here..."
              className={`w-full h-40 p-3 rounded-lg font-mono text-sm resize-none ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-gray-100 placeholder-gray-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } border focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          {/* Preview button */}
          {!result && inputText.trim() && (
            <button
              onClick={handlePreview}
              className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
            >
              Preview Conversion
            </button>
          )}

          {/* Result preview */}
          {result && (
            <div className="space-y-3">
              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
                } border`}>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-medium text-yellow-700 dark:text-yellow-400 text-sm">Notes:</p>
                      <ul className="text-sm text-yellow-600 dark:text-yellow-500 list-disc list-inside">
                        {result.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview code */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mermaid Output:
                </label>
                <pre className={`p-3 rounded-lg font-mono text-sm overflow-auto max-h-48 ${
                  isDarkMode ? 'bg-slate-900' : 'bg-gray-100'
                }`}>
                  <code>{result.code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            className={`px-4 py-2 rounded ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          {result && (
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded"
            >
              Import Diagram
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
