import React, { useState, useRef, useEffect } from 'react';
import { templates, getTemplatesGroupedByCategory, DiagramTemplate } from '../utils/diagramTemplates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: DiagramTemplate) => void;
  isDarkMode: boolean;
}

const categoryLabels: Record<string, string> = {
  flowchart: 'Flowchart',
  sequence: 'Sequence',
  class: 'Class',
  er: 'ER Diagram',
  state: 'State',
  gantt: 'Gantt',
  other: 'Other',
};

const categoryIcons: Record<string, string> = {
  flowchart: 'M4 5h16M4 10h16M4 15h16',
  sequence: 'M8 9l4-4 4 4M16 15l-4 4-4-4',
  class: 'M4 6h16M4 12h16M4 18h16',
  er: 'M12 4v16m-8-8h16',
  state: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  gantt: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7',
  other: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const groupedTemplates = getTemplatesGroupedByCategory();
  const categories = Object.keys(groupedTemplates);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTemplate = (template: DiagramTemplate) => {
    onSelectTemplate(template);
    setIsOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setSelectedCategory(null);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
          isDarkMode
            ? 'bg-slate-700 hover:bg-slate-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
        }`}
        title="Templates"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <span className="hidden sm:inline">Templates</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg z-50 overflow-hidden ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}
        >
          {/* Categories */}
          {!selectedCategory && (
            <div className="py-1">
              <div className={`px-3 py-2 text-xs font-semibold uppercase ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Categories
              </div>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm ${
                    isDarkMode ? 'hover:bg-slate-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={categoryIcons[category] || categoryIcons.other} />
                  </svg>
                  <span className="flex-1 text-left">{categoryLabels[category] || category}</span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {groupedTemplates[category].length}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Templates in selected category */}
          {selectedCategory && (
            <div className="py-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm border-b ${
                  isDarkMode
                    ? 'hover:bg-slate-700 text-gray-200 border-slate-700'
                    : 'hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>{categoryLabels[selectedCategory]}</span>
              </button>
              {groupedTemplates[selectedCategory].map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    isDarkMode ? 'hover:bg-slate-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
