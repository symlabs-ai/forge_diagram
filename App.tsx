import React, { useState, useEffect, useRef } from 'react';
import { Editor } from './components/Editor';
import { Toolbar } from './components/Toolbar';
import { detectOrientation, toggleOrientationInCode, INITIAL_CODE } from './utils/mermaidUtils';
import { Orientation } from './types';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import * as d3 from "d3";

const App: React.FC = () => {
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<Orientation>('TD');
  const [isDraggingNode, setIsDraggingNode] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Ref for the zoom wrapper instance
  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync orientation state when code changes manually
  useEffect(() => {
    const currentDir = detectOrientation(code);
    setOrientation(currentDir);
  }, [code]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setError(null); 
  };

  const handleToggleOrientation = () => {
    // Detecta orientação diretamente do código atual (evita estado dessincronizado)
    const currentDir = detectOrientation(code);
    const newCode = toggleOrientationInCode(code, currentDir);
    setCode(newCode);
    // Força refresh do componente para limpar cache do Mermaid
    setRefreshKey(prev => prev + 1);
  };

  const handlePrint = () => {
    if (transformComponentRef.current) {
      transformComponentRef.current.resetTransform();
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-darker text-slate-900 dark:text-gray-100">
      
      <Toolbar
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onUpload={handleCodeChange}
        onPrint={handlePrint}
        onRefresh={handleRefresh}
        orientation={orientation}
        toggleOrientation={handleToggleOrientation}
        zoomIn={() => transformComponentRef.current?.zoomIn()}
        zoomOut={() => transformComponentRef.current?.zoomOut()}
        resetTransform={() => transformComponentRef.current?.resetTransform()}
      />

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Editor Section */}
        <div className="w-full md:w-1/3 min-w-[300px] h-1/2 md:h-full p-4 border-r border-gray-200 dark:border-slate-800 no-print">
          <Editor 
            code={code} 
            onChange={handleCodeChange} 
            error={error} 
          />
        </div>

        {/* Preview Section */}
        <div className="w-full md:w-2/3 h-1/2 md:h-full p-4 bg-gray-100 dark:bg-slate-900 relative">
          
          <div className="h-full w-full shadow-xl rounded-lg bg-white dark:bg-slate-800 overflow-hidden flex flex-col">
             <TransformWrapper
                ref={transformComponentRef}
                initialScale={1}
                minScale={0.1}
                maxScale={4}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
                disabled={isDraggingNode}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ width: "100%", height: "100%" }}
                  wrapperClass="w-full h-full"
                  contentClass="w-full h-full flex items-center justify-center"
                >
                   <InnerMermaidRenderer
                     key={refreshKey}
                     code={code}
                     isDarkMode={isDarkMode}
                     onError={setError}
                     onSuccess={() => setError(null)}
                     setIsDraggingNode={setIsDraggingNode}
                   />
                </TransformComponent>
            </TransformWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- GEOMETRY HELPERS ---

// Get the BBox of a node including its current transform
const getNodeBBox = (node: Element) => {
  const el = node as any;
  const bbox = el.getBBox(); // Local coordinates (untransformed)
  const transform = d3.select(node).attr("transform");
  let tx = 0, ty = 0;
  
  if (transform) {
    // Handle translate(x,y) or translate(x)
    const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(transform);
    if (match) {
        tx = parseFloat(match[1]) || 0;
        ty = parseFloat(match[2]) || 0;
    }
  }

  const x = bbox.x + tx;
  const y = bbox.y + ty;
  
  return {
    x,
    y,
    width: bbox.width,
    height: bbox.height,
    cx: x + bbox.width / 2,
    cy: y + bbox.height / 2
  };
};

// Check if a point is close to a BBox
const isPointInBBox = (point: {x: number, y: number}, bbox: ReturnType<typeof getNodeBBox>) => {
  const tolerance = 20; // Increased tolerance
  return (
    point.x >= bbox.x - tolerance &&
    point.x <= bbox.x + bbox.width + tolerance &&
    point.y >= bbox.y - tolerance &&
    point.y <= bbox.y + bbox.height + tolerance
  );
};

// Calculate the intersection point between a line (from center to targetCenter) and the node's bounding box
const getIntersection = (rect: any, targetCenter: {cx: number, cy: number}) => {
    const dx = targetCenter.cx - rect.cx;
    const dy = targetCenter.cy - rect.cy;
    
    // If centers are the same, return center
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return { x: rect.cx, y: rect.cy };

    const w = rect.width / 2;
    const h = rect.height / 2;
    
    // Avoid division by zero
    if (dx === 0) return { x: rect.cx, y: rect.cy + (dy > 0 ? h : -h) };
    if (dy === 0) return { x: rect.cx + (dx > 0 ? w : -w), y: rect.cy };

    const tanTheta = Math.abs(dy / dx);
    const tanAlpha = h / w;

    let ix, iy;

    if (tanTheta < tanAlpha) {
        // Left or Right
        if (dx > 0) {
             ix = rect.cx + w;
             iy = rect.cy + w * (dy / dx);
        } else {
             ix = rect.cx - w;
             iy = rect.cy - w * (dy / dx);
        }
    } else {
        // Top or Bottom
        if (dy > 0) {
            iy = rect.cy + h;
            ix = rect.cx + h * (dx / dy);
        } else {
            iy = rect.cy - h;
            ix = rect.cx - h * (dx / dy);
        }
    }
    
    return { x: ix, y: iy };
};

// Contador global para IDs únicos
let globalRenderCounter = 0;

const InnerMermaidRenderer: React.FC<import('./types').PreviewProps> = ({
  code,
  isDarkMode,
  onError,
  onSuccess,
  setIsDraggingNode
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Renderiza quando code ou isDarkMode mudam
  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      console.log('renderDiagram called, code length:', code.length);

      if (!code.trim()) {
        setSvgContent('');
        return;
      }

      // Limpa SVG atual primeiro
      setSvgContent('');

      // Limpa TODOS os elementos mermaid do DOM
      document.querySelectorAll('[id^="mermaid"]').forEach(el => el.remove());
      document.querySelectorAll('[id^="dmermaid"]').forEach(el => el.remove());
      document.querySelectorAll('.mermaid').forEach(el => {
        if (!containerRef.current?.contains(el)) el.remove();
      });

      // Reimporta mermaid fresh a cada render (nuclear option)
      const mermaid = await import('mermaid');
      const mermaidInstance = mermaid.default;

      if (cancelled) return;

      // Tenta resetar qualquer estado interno do Mermaid
      try {
        if (mermaidInstance.mermaidAPI?.reset) {
          mermaidInstance.mermaidAPI.reset();
        }
        if ((mermaidInstance as any).reset) {
          (mermaidInstance as any).reset();
        }
        // Limpa diagrams registry se existir
        if ((mermaidInstance as any).diagrams) {
          (mermaidInstance as any).diagrams = {};
        }
      } catch (e) {
        // Ignora erros de reset
      }

      // Inicializa com configuração limpa
      mermaidInstance.initialize({
        startOnLoad: false,
        theme: isDarkMode ? 'dark' : 'default',
        securityLevel: 'loose',
      });

      try {
        globalRenderCounter += 1;
        const id = `mermaid${globalRenderCounter}`;

        // Para classDiagram, usa init directive para forçar re-render completo
        let codeToRender = code;
        if (code.trim().toLowerCase().startsWith('classdiagram')) {
          const hasLR = /direction\s+LR/i.test(code);
          const direction = hasLR ? 'LR' : 'TB';
          // Usa timestamp + counter para garantir que cada render seja único
          const cacheBuster = `${globalRenderCounter}_${Date.now()}`;
          const initDirective = `%%{init: {'flowchart': {'diagramPadding': ${cacheBuster.length}}, 'themeVariables': {'cacheBust': '${cacheBuster}'}}}%%\n`;
          codeToRender = initDirective + code.replace(/direction\s+(TD|TB|LR|RL)/gi, `direction ${direction}`);
        }

        const { svg } = await mermaidInstance.render(id, codeToRender);

        if (cancelled) return;

        setSvgContent(svg);
        onSuccess();
      } catch (e: any) {
        if (cancelled) return;
        const msg = e.message || "Erro de sintaxe no diagrama";
        onError(msg);
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, isDarkMode, onError, onSuccess]);

  // D3 Logic
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const div = d3.select(containerRef.current);
    const svg = div.select("svg");
    if (svg.empty()) return;

    const nodes = svg.selectAll(".node");
    // Select path elements directly under .edgePaths (handles different mermaid versions)
    const edges = svg.selectAll(".edgePaths path"); 
    const labels = svg.selectAll(".edgeLabels .edgeLabel");
    
    const edgeMeta: { 
        edgeEl: any; 
        labelEl: any;
        sourceNode: any; 
        targetNode: any;
    }[] = [];

    const nodeData = nodes.nodes().map((n: any) => ({
        element: n,
        bbox: getNodeBBox(n)
    }));

    edges.each(function(d, i) {
        const path = d3.select(this); // 'this' is the path element itself now
        const dAttr = path.attr("d");
        if (!dAttr) return;

        const numbers = dAttr.match(/-?\d+(\.\d+)?/g)?.map(parseFloat);
        if (!numbers || numbers.length < 4) return;

        const startX = numbers[0];
        const startY = numbers[1];
        const endX = numbers[numbers.length - 2];
        const endY = numbers[numbers.length - 1];

        let bestStartNode = null;
        let bestEndNode = null;
        let minStartDist = Infinity;
        let minEndDist = Infinity;

        nodeData.forEach(nd => {
            // Check Start
            const distStart = Math.hypot(nd.bbox.cx - startX, nd.bbox.cy - startY);
            // Prioritize containment, then distance
            const inStart = isPointInBBox({x: startX, y: startY}, nd.bbox);
            
            if (inStart || distStart < minStartDist) {
                // If we found a contained one, it wins unless we find another contained one (rare overlap)
                // If neither contained, closest wins
                if (inStart) {
                     bestStartNode = nd.element;
                     minStartDist = -1; // Flag as found inside
                } else if (minStartDist !== -1) {
                     minStartDist = distStart;
                     bestStartNode = nd.element;
                }
            }

            // Check End
            const distEnd = Math.hypot(nd.bbox.cx - endX, nd.bbox.cy - endY);
            const inEnd = isPointInBBox({x: endX, y: endY}, nd.bbox);
            
            if (inEnd || distEnd < minEndDist) {
                if (inEnd) {
                    bestEndNode = nd.element;
                    minEndDist = -1;
                } else if (minEndDist !== -1) {
                    minEndDist = distEnd;
                    bestEndNode = nd.element;
                }
            }
        });

        // Filter out bad matches (distance too far if not contained)
        if (minStartDist > 200 && minStartDist !== -1) bestStartNode = null;
        if (minEndDist > 200 && minEndDist !== -1) bestEndNode = null;

        if (bestStartNode && bestEndNode) {
            // Calcular ponto médio da edge para encontrar label por proximidade
            const edgeMidX = (startX + endX) / 2;
            const edgeMidY = (startY + endY) / 2;

            // Encontrar o label mais próximo do ponto médio da edge
            let closestLabel: any = null;
            let minLabelDist = Infinity;

            labels.each(function() {
                const labelNode = this as SVGGElement;
                const labelTransform = d3.select(labelNode).attr("transform");
                let labelX = 0, labelY = 0;

                if (labelTransform) {
                    const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(labelTransform);
                    if (match) {
                        labelX = parseFloat(match[1]) || 0;
                        labelY = parseFloat(match[2]) || 0;
                    }
                }

                const dist = Math.hypot(labelX - edgeMidX, labelY - edgeMidY);
                if (dist < minLabelDist) {
                    minLabelDist = dist;
                    closestLabel = labelNode;
                }
            });

            // Só associa se o label estiver razoavelmente próximo
            const labelEl = minLabelDist < 150 ? closestLabel : null;

            edgeMeta.push({
                edgeEl: path,
                labelEl: labelEl,
                sourceNode: bestStartNode,
                targetNode: bestEndNode
            });
        }
    });

    const updateConnectedEdges = (node: any) => {
        const relevantEdges = edgeMeta.filter(e => e.sourceNode === node || e.targetNode === node);
        
        relevantEdges.forEach(item => {
            const sourceBBox = getNodeBBox(item.sourceNode);
            const targetBBox = getNodeBBox(item.targetNode);

            if (item.sourceNode === item.targetNode) return;

            const startPoint = getIntersection(sourceBBox, { cx: targetBBox.cx, cy: targetBBox.cy });
            const endPoint = getIntersection(targetBBox, { cx: sourceBBox.cx, cy: sourceBBox.cy });

            const newD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
            item.edgeEl.attr("d", newD);

            if (item.labelEl) {
                const midX = (startPoint.x + endPoint.x) / 2;
                const midY = (startPoint.y + endPoint.y) / 2;

                // Obter dimensões do label para centralizar corretamente
                const labelBBox = (item.labelEl as SVGGElement).getBBox();
                const labelWidth = labelBBox.width;
                const labelHeight = labelBBox.height;

                // Centralizar o label no ponto médio da edge
                const centeredX = midX - labelWidth / 2;
                const centeredY = midY - labelHeight / 2;

                d3.select(item.labelEl).attr("transform", `translate(${centeredX}, ${centeredY})`);
            }
        });
    };

    const dragBehavior = d3.drag()
      .on("start", function() {
        d3.select(this).raise().classed("active", true).style("cursor", "grabbing");
        setIsDraggingNode(true);
      })
      .on("drag", function(event: any) {
        const node = d3.select(this);
        const transform = node.attr("transform");
        let currentX = 0, currentY = 0;
        
        if (transform) {
          const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(transform);
          if (match) {
            currentX = parseFloat(match[1]) || 0;
            currentY = parseFloat(match[2]) || 0;
          }
        }

        const newX = currentX + event.dx;
        const newY = currentY + event.dy;
        node.attr("transform", `translate(${newX}, ${newY})`);
        
        updateConnectedEdges(this);
      })
      .on("end", function() {
        d3.select(this).classed("active", false).style("cursor", "grab");
        setIsDraggingNode(false);
      });

    nodes.style("cursor", "grab").call(dragBehavior as any);

  }, [svgContent, setIsDraggingNode]);

  if (!svgContent) {
    return <div className="text-gray-400">Gerando visualização...</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default App;