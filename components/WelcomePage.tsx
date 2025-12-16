import React from 'react';

interface WelcomePageProps {
  isDarkMode: boolean;
  onNewDiagram: () => void;
  onNewMarkdown: () => void;
  onOpenFolder: () => void;
  onOpenFile: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  isDarkMode,
  onNewDiagram,
  onNewMarkdown,
  onOpenFolder,
  onOpenFile,
}) => {
  return (
    <div className={`flex-1 flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
      <div className="text-center max-w-lg px-8">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            forge Diagram
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Editor de diagramas Mermaid e PlantUML
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Comecar
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* New Diagram */}
            <button
              onClick={onNewDiagram}
              className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
                isDarkMode
                  ? 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800'
                  : 'border-gray-300 hover:border-indigo-500 hover:bg-white'
              }`}
            >
              <div className="text-3xl mb-2">📊</div>
              <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Novo Diagrama
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Mermaid / PlantUML
              </div>
            </button>

            {/* New Markdown */}
            <button
              onClick={onNewMarkdown}
              className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
                isDarkMode
                  ? 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800'
                  : 'border-gray-300 hover:border-indigo-500 hover:bg-white'
              }`}
            >
              <div className="text-3xl mb-2">📝</div>
              <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Novo Markdown
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Documentacao
              </div>
            </button>

            {/* Open Folder */}
            <button
              onClick={onOpenFolder}
              className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
                isDarkMode
                  ? 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800'
                  : 'border-gray-300 hover:border-indigo-500 hover:bg-white'
              }`}
            >
              <div className="text-3xl mb-2">📁</div>
              <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Abrir Pasta
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Workspace local
              </div>
            </button>

            {/* Open File */}
            <button
              onClick={onOpenFile}
              className={`p-4 rounded-lg border-2 border-dashed transition-colors ${
                isDarkMode
                  ? 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800'
                  : 'border-gray-300 hover:border-indigo-500 hover:bg-white'
              }`}
            >
              <div className="text-3xl mb-2">📄</div>
              <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Abrir Arquivo
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                .mmd, .md, .puml
              </div>
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className={`mt-8 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <p>Atalhos: <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-700">Ctrl+N</kbd> novo diagrama</p>
        </div>
      </div>
    </div>
  );
};
