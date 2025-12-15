import React, { useState } from 'react';
import { FileNode } from '../types';
import { getFileIcon } from '../utils/fileSystemUtils';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  isDarkMode: boolean;
  selectedPath: string | null;
  onSelect: (node: FileNode) => void;
}

// File type icons
const FileIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'h-4 w-4' }) => {
  switch (type) {
    case 'diagram':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-indigo-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    case 'markdown':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'plantuml':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
  }
};

// Folder icons
const FolderIcon: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className = 'h-4 w-4' }) => {
  if (isOpen) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-yellow-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`${className} text-yellow-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
};

// Chevron icon
const ChevronIcon: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className = 'h-4 w-4' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-transform ${isOpen ? 'rotate-90' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  level,
  isDarkMode,
  selectedPath,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first 2 levels
  const isFolder = node.type === 'folder';
  const isSelected = selectedPath === node.path;
  const paddingLeft = 8 + level * 16;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  const handleDoubleClick = () => {
    if (!isFolder) {
      onSelect(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer transition-colors ${
          isSelected
            ? isDarkMode
              ? 'bg-indigo-600/30 text-white'
              : 'bg-indigo-100 text-indigo-900'
            : isDarkMode
              ? 'hover:bg-slate-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Expand/collapse icon for folders */}
        {isFolder ? (
          <span className="mr-1 text-gray-400">
            <ChevronIcon isOpen={isOpen} className="h-3 w-3" />
          </span>
        ) : (
          <span className="w-4 mr-1" /> // Spacer for alignment
        )}

        {/* File/folder icon */}
        <span className="mr-2 flex-shrink-0">
          {isFolder ? (
            <FolderIcon isOpen={isOpen} />
          ) : (
            <FileIcon type={getFileIcon(node.name)} />
          )}
        </span>

        {/* Name */}
        <span className="truncate text-sm">{node.name}</span>
      </div>

      {/* Children */}
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              isDarkMode={isDarkMode}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};
