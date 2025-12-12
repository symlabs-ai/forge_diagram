import React, { useState } from 'react';
import type { SavedDiagram } from '../types';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isDarkMode: boolean;
}

export function SaveDialog({ isOpen, onClose, onSave, isDarkMode }: SaveDialogProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg p-6 w-96 shadow-xl`}>
        <h2 className="text-lg font-semibold mb-4">Save Diagram</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Diagram name..."
          className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface LoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  diagrams: SavedDiagram[];
  isDarkMode: boolean;
}

export function LoadDialog({ isOpen, onClose, onLoad, onDelete, diagrams, isDarkMode }: LoadDialogProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg p-6 w-[500px] max-h-[80vh] shadow-xl flex flex-col`}>
        <h2 className="text-lg font-semibold mb-4">Load Diagram</h2>

        {diagrams.length === 0 ? (
          <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No saved diagrams yet
          </p>
        ) : (
          <div className="overflow-y-auto flex-1 -mx-2">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className={`flex items-center justify-between p-3 mx-2 mb-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} cursor-pointer group`}
                onClick={() => {
                  onLoad(diagram.id);
                  onClose();
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{diagram.name}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatDate(diagram.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this diagram?')) {
                      onDelete(diagram.id);
                    }
                  }}
                  className={`ml-2 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'hover:bg-red-600' : 'hover:bg-red-100 text-red-600'}`}
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4 pt-4 border-t border-gray-600">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface RecoveryDialogProps {
  isOpen: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  isDarkMode: boolean;
}

export function RecoveryDialog({ isOpen, onRecover, onDiscard, isDarkMode }: RecoveryDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg p-6 w-96 shadow-xl`}>
        <h2 className="text-lg font-semibold mb-4">Recover Unsaved Work?</h2>
        <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          We found an auto-saved diagram from your last session. Would you like to recover it?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onDiscard}
            className={`px-4 py-2 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Discard
          </button>
          <button
            onClick={onRecover}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Recover
          </button>
        </div>
      </div>
    </div>
  );
}
