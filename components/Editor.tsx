import React from 'react';

interface EditorProps {
  code: string;
  onChange: (newCode: string) => void;
  error: string | null;
}

export const Editor: React.FC<EditorProps> = ({ code, onChange, error }) => {
  return (
    <div className="h-full flex flex-col">
      <textarea
        className="flex-grow p-2 font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck="false"
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
      />
      {error && (
        <div className="mt-2 text-red-500 dark:text-red-400 text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
};
