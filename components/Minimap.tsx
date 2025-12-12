import React, { useMemo } from 'react';

interface MinimapProps {
  svgContent: string;
  scale: number;
  positionX: number;
  positionY: number;
  containerWidth: number;
  containerHeight: number;
  isDarkMode: boolean;
  onNavigate?: (x: number, y: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  svgContent,
  scale,
  positionX,
  positionY,
  containerWidth,
  containerHeight,
  isDarkMode,
  onNavigate,
}) => {
  // Calcula dimensões do viewport indicator
  const viewportStyle = useMemo(() => {
    if (!svgContent) return null;

    // Extrai viewBox do SVG para calcular dimensões
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) return null;

    const [, , svgWidth, svgHeight] = viewBoxMatch[1].split(' ').map(Number);
    if (!svgWidth || !svgHeight) return null;

    const minimapWidth = 128; // w-32
    const minimapHeight = 96; // h-24

    // Escala do minimap
    const minimapScale = Math.min(minimapWidth / svgWidth, minimapHeight / svgHeight);

    // Tamanho do viewport no minimap
    const viewportWidth = (containerWidth / scale) * minimapScale;
    const viewportHeight = (containerHeight / scale) * minimapScale;

    // Posição do viewport no minimap
    const viewportX = (-positionX / scale) * minimapScale;
    const viewportY = (-positionY / scale) * minimapScale;

    return {
      width: Math.min(viewportWidth, minimapWidth),
      height: Math.min(viewportHeight, minimapHeight),
      left: Math.max(0, Math.min(viewportX, minimapWidth - viewportWidth)),
      top: Math.max(0, Math.min(viewportY, minimapHeight - viewportHeight)),
    };
  }, [svgContent, scale, positionX, positionY, containerWidth, containerHeight]);

  // Escala o SVG para caber no minimap
  const scaledSvg = useMemo(() => {
    if (!svgContent) return '';

    // Adiciona preserveAspectRatio e ajusta tamanho
    return svgContent
      .replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%"')
      .replace(/style="[^"]*"/, 'style="width:100%;height:100%"');
  }, [svgContent]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onNavigate || !svgContent) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Extrai viewBox para converter coordenadas
    const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
    if (!viewBoxMatch) return;

    const [, , svgWidth, svgHeight] = viewBoxMatch[1].split(' ').map(Number);
    if (!svgWidth || !svgHeight) return;

    const minimapWidth = rect.width;
    const minimapHeight = rect.height;

    const minimapScale = Math.min(minimapWidth / svgWidth, minimapHeight / svgHeight);

    // Converte posição do clique para coordenadas do diagrama
    const diagramX = (clickX / minimapScale) * scale;
    const diagramY = (clickY / minimapScale) * scale;

    // Centraliza a view no ponto clicado
    const newX = -(diagramX - containerWidth / 2);
    const newY = -(diagramY - containerHeight / 2);

    onNavigate(newX, newY);
  };

  if (!svgContent) return null;

  return (
    <div
      className={`absolute bottom-4 right-4 w-32 h-24 rounded-lg shadow-lg overflow-hidden cursor-crosshair ${
        isDarkMode
          ? 'bg-slate-800/90 border border-slate-600'
          : 'bg-white/90 border border-gray-300'
      }`}
      onClick={handleMinimapClick}
    >
      {/* SVG em miniatura */}
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: scaledSvg }}
      />

      {/* Viewport indicator */}
      {viewportStyle && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
          style={{
            width: `${viewportStyle.width}px`,
            height: `${viewportStyle.height}px`,
            left: `${viewportStyle.left}px`,
            top: `${viewportStyle.top}px`,
          }}
        />
      )}

      {/* Label */}
      <div
        className={`absolute bottom-0 left-0 right-0 text-[10px] text-center py-0.5 ${
          isDarkMode ? 'bg-slate-900/80 text-slate-400' : 'bg-gray-100/80 text-gray-500'
        }`}
      >
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
};
