// src/canvas/DrawingLayoutCanvas.tsx
// Drawing Layout Page - Arrange floor plan, elevations, title block for printing
// Shows REAL content from the design, not placeholders

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer as KonvaLayer, Rect, Text, Line, Group, Image as KonvaImage, Arc, Circle } from 'react-konva';
import Konva from 'konva';
import { jsPDF } from 'jspdf';
import { useEditorStore } from '../state/useEditorStore';
import { BLOCKS_BY_ID } from '../data/blockCatalog';
import { useCatalogStore } from '../state/useCatalogStore';

// Paper sizes in mm
const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
  A1: { width: 594, height: 841 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
  Tabloid: { width: 279, height: 432 },
};

type PaperSize = keyof typeof PAPER_SIZES;
type Orientation = 'portrait' | 'landscape';

interface TitleBlockData {
  companyName: string;
  companyLogo?: string;
  projectName: string;
  customerName: string;
  customerAddress: string;
  designerName: string;
  date: string;
  scale: string;
  sheetNumber: string;
  totalSheets: string;
  notes: string;
}

interface PageContent {
  id: string;
  type: 'floorPlan' | 'elevation' | 'itemsList' | 'combined';
  title: string;
  headerTitle?: string; // Custom title shown at top of page (defaults to project name)
  wallId?: string;
  floorPlanPageId?: string; // Reference to specific floor plan page
}

export const DrawingLayoutCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [paperSize, setPaperSize] = useState<PaperSize>('A3');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [scale, setScale] = useState(1.5);
  const [currentPage, setCurrentPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // For HD zoom
  
  const [pages, setPages] = useState<PageContent[]>([]);
  
  const [titleBlock, setTitleBlock] = useState<TitleBlockData>({
    companyName: 'KAB Studio',
    projectName: 'Kitchen Design',
    customerName: '',
    customerAddress: '',
    designerName: '',
    date: new Date().toLocaleDateString(),
    scale: '1:50',
    sheetNumber: '1',
    totalSheets: '2',
    notes: '',
  });

  const { elements, drawingSettings, floorPlanPages, currentFloorPlanPageId } = useEditorStore();
  const { catalogById } = useCatalogStore();

  // Get paper dimensions
  const getPaperDimensions = () => {
    const size = PAPER_SIZES[paperSize];
    return orientation === 'landscape' 
      ? { width: size.height, height: size.width }
      : size;
  };

  const paper = getPaperDimensions();

  // Sync pages with floor plan pages
  useEffect(() => {
    const floorPlanLayoutPages: PageContent[] = floorPlanPages.map((fpPage, index) => ({
      id: `fp-${fpPage.id}`,
      type: 'floorPlan' as const,
      title: fpPage.name,
      headerTitle: '',
      floorPlanPageId: fpPage.id,
    }));
    
    // Add items list page at the end
    const itemsPage: PageContent = {
      id: 'items-list',
      type: 'itemsList',
      title: 'Items List & Schedule',
      headerTitle: '',
    };
    
    setPages([...floorPlanLayoutPages, itemsPage]);
    setTitleBlock(prev => ({ ...prev, totalSheets: String(floorPlanLayoutPages.length + 1) }));
  }, [floorPlanPages]);

  // Resize handler
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  // Get items for the items list
  const getItemsList = () => {
    const items: { name: string; type: string; qty: number; price: number; dimensions: string }[] = [];
    const grouped: Record<string, { count: number; price: number; type: string; width?: number; height?: number }> = {};
    
    elements.forEach(el => {
      if (['furniture', 'door', 'window'].includes(el.type)) {
        const elem = el as any;
        const key = elem.name || elem.blockName || el.type;
        if (!grouped[key]) {
          grouped[key] = { count: 0, price: elem.price || 0, type: el.type, width: elem.width, height: elem.height };
        }
        grouped[key].count++;
      }
    });
    
    Object.entries(grouped).forEach(([name, data]) => {
      items.push({
        name,
        type: data.type,
        qty: data.count,
        price: data.price * data.count,
        dimensions: data.width && data.height ? `${data.width}×${data.height}mm` : '-',
      });
    });
    
    return items;
  };

  // Get walls for elevation pages
  const getWalls = () => {
    return elements.filter(el => el.type === 'wall');
  };

  // Add elevation page
  const addElevationPage = () => {
    const walls = getWalls();
    if (walls.length === 0) {
      alert('No walls in design. Draw walls first.');
      return;
    }
    const newPage: PageContent = {
      id: `page-${Date.now()}`,
      type: 'elevation',
      title: `Elevation - Wall ${pages.filter(p => p.type === 'elevation').length + 1}`,
      wallId: walls[0]?.id,
    };
    setPages([...pages, newPage]);
    setTitleBlock({ ...titleBlock, totalSheets: String(pages.length + 1) });
  };

  // Remove page
  const removePage = (pageId: string) => {
    if (pages.length <= 1) return;
    setPages(pages.filter(p => p.id !== pageId));
    if (currentPage >= pages.length - 1) {
      setCurrentPage(Math.max(0, pages.length - 2));
    }
    setTitleBlock({ ...titleBlock, totalSheets: String(pages.length - 1) });
  };

  // Export single page to PDF
  const exportCurrentPageToPDF = async () => {
    if (!stageRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 });
      
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [paper.width, paper.height],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, paper.width, paper.height);
      
      pdf.setProperties({
        title: `${titleBlock.projectName} - Page ${currentPage + 1}`,
        author: titleBlock.designerName || 'KAB Studio',
      });

      pdf.save(`${titleBlock.projectName || 'drawing'}_page${currentPage + 1}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    }
    setIsExporting(false);
  };

  // Capture floor plan from the main stage (like the working export does)
  const captureFloorPlanForPDF = (): string | null => {
    const mainStage = useEditorStore.getState().floorPlanStage;
    if (!mainStage) {
      console.log('No floor plan stage found');
      return null;
    }
    
    // Hide UI layers before capture (same as exportStageToPDF)
    const gridLayer = mainStage.findOne('.grid-layer') || mainStage.getLayers().find((l: any) => l.name() === 'grid-layer');
    const selectionLayer = mainStage.findOne('.selection-layer');
    const transformer = mainStage.findOne('Transformer');
    
    const prevGrid = gridLayer?.visible();
    const prevSelection = selectionLayer?.visible();
    const prevTransformer = transformer?.visible();
    
    if (gridLayer) gridLayer.visible(false);
    if (selectionLayer) selectionLayer.visible(false);
    if (transformer) transformer.visible(false);
    
    mainStage.draw();
    
    const dataUrl = mainStage.toDataURL({
      pixelRatio: 3,
      mimeType: 'image/png',
      quality: 1.0,
    });
    
    // Restore visibility
    if (gridLayer && prevGrid !== undefined) gridLayer.visible(prevGrid);
    if (selectionLayer && prevSelection !== undefined) selectionLayer.visible(prevSelection);
    if (transformer && prevTransformer !== undefined) transformer.visible(prevTransformer);
    mainStage.draw();
    
    return dataUrl;
  };

  // Export ALL pages to multi-page PDF
  const exportAllPagesToPDF = async () => {
    setIsExporting(true);
    const originalPage = currentPage;
    
    try {
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [paper.width, paper.height],
      });

      // Debug: Log elements count
      console.log('Export - Total elements:', elements.length);
      console.log('Export - Floor plan pages:', floorPlanPages.length);

      // Export each page by capturing from the Layout canvas
      for (let i = 0; i < pages.length; i++) {
        // Switch to the page we want to export
        setCurrentPage(i);
        
        // Wait longer for render to complete (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force stage to redraw
        if (stageRef.current) {
          stageRef.current.batchDraw();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (i > 0) {
          pdf.addPage([paper.width, paper.height], orientation);
        }
        
        // Capture current page from the stage
        if (stageRef.current) {
          const dataUrl = stageRef.current.toDataURL({
            pixelRatio: 3,
            mimeType: 'image/png',
            quality: 1.0,
          });
          
          // Add the captured image to PDF (scaled to fit paper)
          pdf.addImage(dataUrl, 'PNG', 0, 0, paper.width, paper.height);
        }
      }

      pdf.setProperties({
        title: `${titleBlock.projectName} - Complete Drawing Set`,
        author: titleBlock.designerName || 'KAB Studio',
        creator: 'KAB Studio',
      });

      pdf.save(`${titleBlock.projectName || 'drawing'}_complete.pdf`);
      
      // Restore original page
      setCurrentPage(originalPage);
      
      alert(`Exported ${pages.length} pages successfully!`);
    } catch (error) {
      console.error('Multi-page export error:', error);
      alert('Export failed: ' + error);
      setCurrentPage(originalPage);
    }
    setIsExporting(false);
  };

  // Render title block
  const renderTitleBlock = (x: number, y: number, width: number, height: number) => {
    return (
      <Group x={x} y={y}>
        <Rect width={width} height={height} fill="#fff" stroke="#000" strokeWidth={2} />
        
        {/* Company section */}
        <Rect width={width * 0.4} height={height * 0.5} stroke="#000" strokeWidth={1} />
        <Text x={5} y={5} text={titleBlock.companyName} fontSize={12} fontStyle="bold" />
        <Text x={5} y={22} text={titleBlock.projectName} fontSize={10} />
        
        {/* Customer section */}
        <Rect x={width * 0.4} width={width * 0.35} height={height * 0.5} stroke="#000" strokeWidth={1} />
        <Text x={width * 0.4 + 5} y={5} text="Customer:" fontSize={8} fill="#666" />
        <Text x={width * 0.4 + 5} y={16} text={titleBlock.customerName || '-'} fontSize={9} />
        
        {/* Scale & Date */}
        <Rect x={width * 0.75} width={width * 0.25} height={height * 0.5} stroke="#000" strokeWidth={1} />
        <Text x={width * 0.75 + 5} y={5} text={`Scale: ${titleBlock.scale}`} fontSize={9} />
        <Text x={width * 0.75 + 5} y={18} text={`Date: ${titleBlock.date}`} fontSize={8} />
        
        {/* Bottom row */}
        <Rect y={height * 0.5} width={width * 0.7} height={height * 0.5} stroke="#000" strokeWidth={1} />
        <Text x={5} y={height * 0.5 + 5} text={`Designer: ${titleBlock.designerName || '-'}`} fontSize={9} />
        
        {/* Sheet number */}
        <Rect x={width * 0.7} y={height * 0.5} width={width * 0.3} height={height * 0.5} stroke="#000" strokeWidth={1} />
        <Text 
          x={width * 0.7 + 5} 
          y={height * 0.5 + 8} 
          text={`Sheet ${currentPage + 1} of ${pages.length}`} 
          fontSize={11} 
          fontStyle="bold" 
        />
      </Group>
    );
  };

  // Render items list table
  const renderItemsList = (x: number, y: number, width: number, height: number) => {
    const items = getItemsList();
    const rowHeight = 18;
    const headerHeight = 25;
    
    return (
      <Group x={x} y={y}>
        {/* Table header */}
        <Rect width={width} height={headerHeight} fill="#1e293b" />
        <Text x={10} y={7} text="Item" fontSize={10} fill="#fff" fontStyle="bold" />
        <Text x={width * 0.45} y={7} text="Type" fontSize={10} fill="#fff" fontStyle="bold" />
        <Text x={width * 0.6} y={7} text="Qty" fontSize={10} fill="#fff" fontStyle="bold" />
        <Text x={width * 0.7} y={7} text="Size" fontSize={10} fill="#fff" fontStyle="bold" />
        <Text x={width * 0.85} y={7} text="Price" fontSize={10} fill="#fff" fontStyle="bold" />
        
        {/* Table rows */}
        {items.slice(0, Math.floor((height - headerHeight - 30) / rowHeight)).map((item, i) => (
          <Group key={i} y={headerHeight + i * rowHeight}>
            <Rect width={width} height={rowHeight} fill={i % 2 === 0 ? '#f8fafc' : '#fff'} stroke="#e2e8f0" strokeWidth={0.5} />
            <Text x={10} y={4} text={item.name} fontSize={9} width={width * 0.4} ellipsis />
            <Text x={width * 0.45} y={4} text={item.type} fontSize={9} fill="#64748b" />
            <Text x={width * 0.6} y={4} text={String(item.qty)} fontSize={9} />
            <Text x={width * 0.7} y={4} text={item.dimensions} fontSize={8} fill="#64748b" />
            <Text x={width * 0.85} y={4} text={item.price > 0 ? `$${item.price.toFixed(0)}` : '-'} fontSize={9} />
          </Group>
        ))}
        
        {/* Total row */}
        {(() => {
          const total = items.reduce((sum, item) => sum + item.price, 0);
          const totalY = headerHeight + Math.min(items.length, Math.floor((height - headerHeight - 30) / rowHeight)) * rowHeight;
          return (
            <Group y={totalY}>
              <Rect width={width} height={rowHeight + 5} fill="#1e293b" />
              <Text x={width * 0.7} y={6} text="TOTAL:" fontSize={10} fill="#fff" fontStyle="bold" />
              <Text x={width * 0.85} y={6} text={`$${total.toFixed(2)}`} fontSize={10} fill="#10b981" fontStyle="bold" />
            </Group>
          );
        })()}
        
        {items.length === 0 && (
          <Text x={width / 2 - 50} y={headerHeight + 20} text="No items in design" fontSize={10} fill="#94a3b8" />
        )}
      </Group>
    );
  };

  // Render floor plan by directly drawing elements from store (no snapshot needed)
  const renderFloorPlan = (x: number, y: number, width: number, height: number, pageElements?: any[]) => {
    // Get all renderable elements (include more types)
    // If pageElements is provided, use those; otherwise use current elements
    const sourceElements = pageElements || elements;
    const renderableElements = sourceElements.filter((el: any) => 
      ['wall', 'door', 'window', 'furniture', 'line', 'polyline', 'rect', 'rectangle', 'circle', 'ellipse', 'arc', 'text', 'free', 'dimension'].includes(el.type)
    );
    
    // Debug: log element types
    console.log('Layout - All elements:', elements.length, 'Renderable:', renderableElements.length);
    console.log('Element types:', renderableElements.map(e => e.type));
    
    if (renderableElements.length === 0) {
      return (
        <Group x={x} y={y}>
          <Rect width={width} height={height} fill="#fff" stroke="#94a3b8" strokeWidth={1} />
          <Text 
            x={width / 2 - 80} 
            y={height / 2 - 10} 
            text="No elements in Floor Plan.\nDraw walls, add furniture, etc." 
            fontSize={11} 
            fill="#94a3b8" 
            align="center"
          />
        </Group>
      );
    }
    
    // Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    renderableElements.forEach(el => {
      const elem = el as any;
      if (elem.points && elem.points.length >= 2) {
        for (let i = 0; i < elem.points.length; i += 2) {
          if (!isNaN(elem.points[i]) && !isNaN(elem.points[i + 1])) {
            minX = Math.min(minX, elem.points[i]);
            maxX = Math.max(maxX, elem.points[i]);
            minY = Math.min(minY, elem.points[i + 1]);
            maxY = Math.max(maxY, elem.points[i + 1]);
          }
        }
      }
      if (elem.x !== undefined && elem.y !== undefined) {
        const w = elem.width || elem.radius * 2 || 50;
        const h = elem.height || elem.radius * 2 || 50;
        minX = Math.min(minX, elem.x - (elem.radius || 0));
        maxX = Math.max(maxX, elem.x + w);
        minY = Math.min(minY, elem.y - (elem.radius || 0));
        maxY = Math.max(maxY, elem.y + h);
      }
      if (elem.outerPoly) {
        for (let i = 0; i < elem.outerPoly.length; i += 2) {
          minX = Math.min(minX, elem.outerPoly[i]);
          maxX = Math.max(maxX, elem.outerPoly[i]);
          minY = Math.min(minY, elem.outerPoly[i + 1]);
          maxY = Math.max(maxY, elem.outerPoly[i + 1]);
        }
      }
      // Handle dimension elements
      if (elem.startPoint && elem.endPoint) {
        minX = Math.min(minX, elem.startPoint.x, elem.endPoint.x);
        maxX = Math.max(maxX, elem.startPoint.x, elem.endPoint.x);
        minY = Math.min(minY, elem.startPoint.y, elem.endPoint.y);
        maxY = Math.max(maxY, elem.startPoint.y, elem.endPoint.y);
      }
    });
    
    // Add padding
    const padding = 30;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Calculate scale to fit
    const fitScale = Math.min((width - 20) / contentWidth, (height - 20) / contentHeight, 1);
    
    // Center offset
    const offsetX = (width - contentWidth * fitScale) / 2 - minX * fitScale;
    const offsetY = (height - contentHeight * fitScale) / 2 - minY * fitScale;
    
    return (
      <Group x={x} y={y}>
        <Rect width={width} height={height} fill="#fff" stroke="#94a3b8" strokeWidth={1} />
        <Group x={offsetX} y={offsetY} scaleX={fitScale} scaleY={fitScale}>
          {renderableElements.map(el => {
            const elem = el as any;
            
            // Render walls
            if (el.type === 'wall') {
              return (
                <Group key={el.id}>
                  {elem.outerPoly && (
                    <>
                      {elem.fill && elem.fill !== 'transparent' && (
                        <Line points={elem.outerPoly} closed fill={elem.fill} stroke={undefined} strokeWidth={0} />
                      )}
                      <Line points={elem.outerPoly} closed stroke={elem.stroke || '#000'} strokeWidth={(elem.strokeWidth || 2)} />
                    </>
                  )}
                  {elem.innerPoly && (
                    <Line points={elem.innerPoly} closed stroke="#fff" strokeWidth={(elem.strokeWidth || 2)} />
                  )}
                  {!elem.outerPoly && elem.points && (
                    <Line points={elem.points} stroke={elem.stroke || '#000'} strokeWidth={elem.thickness || 20} />
                  )}
                </Group>
              );
            }
            
            // Render doors with proper arc swing
            if (el.type === 'door') {
              const swingRadius = elem.width || 80;
              const swingAngle = elem.swingAngle || 90;
              return (
                <Group key={el.id} x={elem.x} y={elem.y} rotation={elem.rotation || 0}>
                  {/* Door leaf */}
                  <Line points={[0, 0, swingRadius, 0]} stroke={elem.stroke || '#000'} strokeWidth={2} />
                  {/* Door swing arc */}
                  <Arc
                    x={0}
                    y={0}
                    innerRadius={swingRadius - 1}
                    outerRadius={swingRadius}
                    angle={swingAngle}
                    rotation={-swingAngle}
                    stroke={elem.stroke || '#000'}
                    strokeWidth={1}
                    dash={[4, 4]}
                  />
                </Group>
              );
            }
            
            // Render windows
            if (el.type === 'window') {
              const winWidth = elem.width || 100;
              return (
                <Group key={el.id} x={elem.x} y={elem.y} rotation={elem.rotation || 0}>
                  <Rect x={-winWidth / 2} y={-5} width={winWidth} height={10} fill="#e0f2fe" stroke={elem.stroke || '#000'} strokeWidth={1} />
                  <Line points={[0, -5, 0, 5]} stroke={elem.stroke || '#000'} strokeWidth={1} />
                </Group>
              );
            }
            
            // Render furniture/blocks with full detail from block definition
            if (el.type === 'furniture') {
              const width = elem.width || 50;
              const height = elem.height || 50;
              const minDim = Math.min(width, height);
              const baseStroke = elem.stroke || '#0f172a';
              const baseFill = elem.fill && elem.fill !== 'none' ? elem.fill : 'transparent';
              const detailStroke = '#475569';
              const detailFill = 'rgba(148,163,184,0.35)';
              
              // Find block definition
              const blockKey = elem.blockId || elem.blockName || elem.name;
              const blockDef = blockKey ? ((catalogById && catalogById[blockKey]) || BLOCKS_BY_ID[blockKey]) : undefined;
              
              const resolveStroke = (token?: string) => {
                if (!token || token === 'base') return baseStroke;
                if (token === 'detail') return detailStroke;
                return token;
              };
              const resolveFill = (token?: string) => {
                if (!token || token === 'base') return baseFill;
                if (token === 'detail') return detailFill;
                return token;
              };
              
              return (
                <Group key={el.id} x={elem.x} y={elem.y} rotation={elem.rotation || 0}>
                  {/* Background rect */}
                  <Rect width={width} height={height} fill="transparent" />
                  
                  {/* Render block symbols if available */}
                  {blockDef?.planSymbols ? (
                    blockDef.planSymbols.map((shape: any, idx: number) => {
                      if (shape.kind === 'rect') {
                        return (
                          <Rect
                            key={idx}
                            x={shape.x * width}
                            y={shape.y * height}
                            width={shape.width * width}
                            height={shape.height * height}
                            cornerRadius={(shape.cornerRadius ?? 0) * minDim}
                            stroke={resolveStroke(shape.stroke)}
                            strokeWidth={(shape.strokeWidth ?? 1) * 1.5}
                            dash={shape.dash?.map((d: number) => d * minDim)}
                            fill={resolveFill(shape.fill)}
                          />
                        );
                      }
                      if (shape.kind === 'line') {
                        return (
                          <Line
                            key={idx}
                            points={[
                              shape.points[0] * width,
                              shape.points[1] * height,
                              shape.points[2] * width,
                              shape.points[3] * height,
                            ]}
                            stroke={resolveStroke(shape.stroke)}
                            strokeWidth={(shape.strokeWidth ?? 1) * 1.4}
                            dash={shape.dash?.map((d: number) => d * minDim)}
                          />
                        );
                      }
                      if (shape.kind === 'circle') {
                        return (
                          <Circle
                            key={idx}
                            x={shape.x * width}
                            y={shape.y * height}
                            radius={shape.radius * minDim}
                            stroke={resolveStroke(shape.stroke)}
                            strokeWidth={(shape.strokeWidth ?? 1) * 1.3}
                            fill={resolveFill(shape.fill)}
                            dash={shape.dash?.map((d: number) => d * minDim)}
                          />
                        );
                      }
                      if (shape.kind === 'arc') {
                        return (
                          <Arc
                            key={idx}
                            x={shape.x * width}
                            y={shape.y * height}
                            innerRadius={(shape.innerRadius ?? 0) * minDim}
                            outerRadius={shape.radius * minDim}
                            angle={shape.angle || 90}
                            rotation={shape.rotation || 0}
                            stroke={resolveStroke(shape.stroke)}
                            strokeWidth={(shape.strokeWidth ?? 1) * 1.3}
                            fill={resolveFill(shape.fill)}
                          />
                        );
                      }
                      return null;
                    })
                  ) : (
                    /* Fallback: simple rectangle if no block definition */
                    <Rect 
                      width={width} 
                      height={height} 
                      fill={baseFill || '#f8fafc'} 
                      stroke={baseStroke} 
                      strokeWidth={elem.strokeWidth || 1} 
                    />
                  )}
                </Group>
              );
            }
            
            // Render lines
            if (el.type === 'line' || el.type === 'polyline' || el.type === 'free') {
              const safePoints = (elem.points || []).filter((p: number) => !isNaN(p));
              if (safePoints.length < 4) return null;
              return (
                <Line 
                  key={el.id} 
                  points={safePoints} 
                  stroke={elem.stroke || '#000'} 
                  strokeWidth={elem.strokeWidth || 1} 
                  closed={elem.closed}
                  dash={elem.dash || []}
                  tension={elem.tension || 0}
                />
              );
            }
            
            // Render rectangles (both 'rect' and 'rectangle' types)
            if (el.type === 'rect' || el.type === 'rectangle') {
              // Ensure we have valid dimensions
              const rectWidth = elem.width || 100;
              const rectHeight = elem.height || 100;
              const rectX = elem.x || 0;
              const rectY = elem.y || 0;
              
              return (
                <Group key={el.id} x={rectX} y={rectY} rotation={elem.rotation || 0}>
                  <Rect 
                    width={rectWidth} 
                    height={rectHeight} 
                    fill={elem.fill || 'transparent'} 
                    stroke={elem.stroke || '#000'} 
                    strokeWidth={elem.strokeWidth || 1} 
                    dash={elem.dash || []}
                  />
                </Group>
              );
            }
            
            // Render circles/ellipses
            if (el.type === 'circle' || el.type === 'ellipse') {
              // If it has points, render as polygon approximation
              if (elem.points && elem.points.length > 4) {
                return (
                  <Line 
                    key={el.id} 
                    points={elem.points} 
                    closed 
                    stroke={elem.stroke || '#000'} 
                    strokeWidth={elem.strokeWidth || 1} 
                    fill={elem.fill}
                  />
                );
              }
              // Otherwise render as circle
              return (
                <Circle
                  key={el.id}
                  x={elem.x}
                  y={elem.y}
                  radius={elem.radius || elem.width / 2 || 25}
                  stroke={elem.stroke || '#000'}
                  strokeWidth={elem.strokeWidth || 1}
                  fill={elem.fill}
                />
              );
            }
            
            // Render arcs
            if (el.type === 'arc') {
              return (
                <Arc
                  key={el.id}
                  x={elem.x}
                  y={elem.y}
                  innerRadius={0}
                  outerRadius={elem.radius || 50}
                  angle={Math.abs((elem.endAngle || 90) - (elem.startAngle || 0))}
                  rotation={elem.startAngle || 0}
                  stroke={elem.stroke || '#000'}
                  strokeWidth={elem.strokeWidth || 1}
                  fill={elem.fill}
                />
              );
            }
            
            // Render dimensions
            if (el.type === 'dimension') {
              const start = elem.startPoint;
              const end = elem.endPoint;
              if (!start || !end) return null;
              
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              const offset = 15;
              const perpX = -dy / length * offset;
              const perpY = dx / length * offset;
              
              return (
                <Group key={el.id}>
                  {/* Dimension line */}
                  <Line 
                    points={[start.x + perpX, start.y + perpY, end.x + perpX, end.y + perpY]} 
                    stroke={elem.stroke || '#0ea5e9'} 
                    strokeWidth={1} 
                  />
                  {/* Extension lines */}
                  <Line points={[start.x, start.y, start.x + perpX * 1.3, start.y + perpY * 1.3]} stroke={elem.stroke || '#0ea5e9'} strokeWidth={0.5} />
                  <Line points={[end.x, end.y, end.x + perpX * 1.3, end.y + perpY * 1.3]} stroke={elem.stroke || '#0ea5e9'} strokeWidth={0.5} />
                  {/* Dimension text */}
                  <Text
                    x={midX + perpX}
                    y={midY + perpY - 6}
                    text={elem.text || `${elem.value?.toFixed(2) || length.toFixed(2)} mm`}
                    fontSize={10}
                    fill={elem.stroke || '#0ea5e9'}
                    rotation={Math.abs(angle) > 90 ? angle + 180 : angle}
                    offsetX={20}
                  />
                </Group>
              );
            }
            
            // Render text
            if (el.type === 'text') {
              return (
                <Text 
                  key={el.id} 
                  x={elem.x} 
                  y={elem.y} 
                  text={elem.text || ''} 
                  fontSize={elem.fontSize || 14} 
                  fill={elem.fill || '#000'} 
                  rotation={elem.rotation || 0}
                  fontFamily={elem.fontFamily || 'Arial'}
                />
              );
            }
            
            return null;
          })}
        </Group>
      </Group>
    );
  };

  // Render elevation view for a wall
  const renderElevation = (x: number, y: number, width: number, height: number, wallId?: string) => {
    const wall = wallId ? elements.find(el => el.id === wallId && el.type === 'wall') as any : null;
    const wallHeight = 2700; // Standard wall height in mm
    
    // Get elements on this wall (doors, windows, furniture)
    const wallElements = elements.filter(el => {
      const elem = el as any;
      return elem.wallId === wallId || 
        (el.type === 'door' || el.type === 'window' || el.type === 'furniture');
    });

    // Calculate wall length
    let wallLength = 3000;
    if (wall) {
      if (wall.endPoint && wall.startPoint) {
        wallLength = Math.hypot(wall.endPoint.x - wall.startPoint.x, wall.endPoint.y - wall.startPoint.y);
      } else if (wall.points && wall.points.length >= 4) {
        wallLength = Math.hypot(wall.points[2] - wall.points[0], wall.points[3] - wall.points[1]);
      }
    }

    // Scale to fit
    const scaleX = (width - 40) / wallLength;
    const scaleY = (height - 60) / wallHeight;
    const fitScale = Math.min(scaleX, scaleY);
    
    const floorY = height - 30;
    const wallStartX = 20;

    return (
      <Group x={x} y={y}>
        <Rect width={width} height={height} fill="#fafafa" stroke="#94a3b8" strokeWidth={1} />
        
        {/* Floor line */}
        <Line points={[0, floorY, width, floorY]} stroke="#64748b" strokeWidth={2} />
        <Text x={5} y={floorY + 5} text="FLOOR" fontSize={8} fill="#94a3b8" />
        
        {/* Wall background */}
        <Rect
          x={wallStartX}
          y={floorY - wallHeight * fitScale}
          width={wallLength * fitScale}
          height={wallHeight * fitScale}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        
        {/* Ceiling line */}
        <Line 
          points={[wallStartX, floorY - wallHeight * fitScale, wallStartX + wallLength * fitScale, floorY - wallHeight * fitScale]} 
          stroke="#64748b" 
          strokeWidth={2} 
        />
        <Text x={5} y={floorY - wallHeight * fitScale - 15} text="CEILING" fontSize={8} fill="#94a3b8" />
        
        {/* Render doors on wall */}
        {wallElements.filter(el => el.type === 'door').map((el, i) => {
          const elem = el as any;
          const doorWidth = (elem.width || 900) * fitScale;
          const doorHeight = (elem.doorHeight || 2100) * fitScale;
          const doorX = wallStartX + (i * 1000 * fitScale) + 100;
          
          return (
            <Group key={el.id}>
              <Rect
                x={doorX}
                y={floorY - doorHeight}
                width={doorWidth}
                height={doorHeight}
                fill="#fef3c7"
                stroke="#b45309"
                strokeWidth={1}
              />
              <Text x={doorX + 5} y={floorY - doorHeight + 5} text="DOOR" fontSize={8} fill="#92400e" />
            </Group>
          );
        })}
        
        {/* Render windows on wall */}
        {wallElements.filter(el => el.type === 'window').map((el, i) => {
          const elem = el as any;
          const winWidth = (elem.width || 1200) * fitScale;
          const winHeight = (elem.height || 1200) * fitScale;
          const sillHeight = (elem.sillHeight || 900) * fitScale;
          const winX = wallStartX + (i * 1500 * fitScale) + 500;
          
          return (
            <Group key={el.id}>
              <Rect
                x={winX}
                y={floorY - sillHeight - winHeight}
                width={winWidth}
                height={winHeight}
                fill="#bfdbfe"
                stroke="#0284c7"
                strokeWidth={1}
              />
              <Line
                points={[winX + winWidth/2, floorY - sillHeight - winHeight, winX + winWidth/2, floorY - sillHeight]}
                stroke="#0284c7"
                strokeWidth={1}
              />
              <Text x={winX + 5} y={floorY - sillHeight - winHeight + 5} text="WINDOW" fontSize={8} fill="#0369a1" />
            </Group>
          );
        })}
        
        {/* Render cabinets/furniture */}
        {wallElements.filter(el => el.type === 'furniture').slice(0, 5).map((el, i) => {
          const elem = el as any;
          const cabWidth = (elem.width || 600) * fitScale;
          const cabHeight = (elem.height || 720) * fitScale;
          const floorHeight = (elem.floorHeight || 0) * fitScale;
          const cabX = wallStartX + (i * 650 * fitScale);
          
          return (
            <Group key={el.id}>
              <Rect
                x={cabX}
                y={floorY - floorHeight - cabHeight}
                width={cabWidth}
                height={cabHeight}
                fill="#e2e8f0"
                stroke="#475569"
                strokeWidth={1}
              />
              <Text 
                x={cabX + 3} 
                y={floorY - floorHeight - cabHeight + 3} 
                text={elem.name || elem.blockName || 'Cabinet'} 
                fontSize={7} 
                fill="#334155"
                width={cabWidth - 6}
                ellipsis
              />
            </Group>
          );
        })}
        
        {/* Height markers */}
        <Text x={width - 35} y={floorY - 5} text="0" fontSize={8} fill="#64748b" />
        <Text x={width - 55} y={floorY - wallHeight * fitScale / 2} text={`${Math.round(wallHeight/2)}mm`} fontSize={8} fill="#64748b" />
        <Text x={width - 55} y={floorY - wallHeight * fitScale + 5} text={`${wallHeight}mm`} fontSize={8} fill="#64748b" />
        
        {!wall && (
          <Text 
            x={width / 2 - 50} 
            y={height / 2} 
            text="Sample Elevation" 
            fontSize={10} 
            fill="#94a3b8" 
          />
        )}
      </Group>
    );
  };

  // Render the current page content
  const renderPageContent = () => {
    const page = pages[currentPage];
    if (!page) return null;

    const margin = 10 * scale;
    const titleBlockHeight = 50 * scale;
    const contentWidth = paper.width * scale - margin * 2;
    const contentHeight = paper.height * scale - margin * 2 - titleBlockHeight - 30;
    const contentY = margin + 25;

    // Get elements for specific floor plan page
    const getPageElements = () => {
      if (page.type === 'floorPlan' && page.floorPlanPageId) {
        const fpPage = floorPlanPages.find(p => p.id === page.floorPlanPageId);
        if (fpPage) {
          // If this is the current floor plan page, use current elements
          if (fpPage.id === currentFloorPlanPageId) {
            return elements;
          }
          // Otherwise use the saved elements from that page
          return fpPage.elements;
        }
      }
      return elements;
    };

    return (
      <Group>
        {/* Page title */}
        {/* Page header - shows custom title, project name, or page type */}
        <Text 
          x={margin} 
          y={margin} 
          text={page.headerTitle || titleBlock.projectName || page.title} 
          fontSize={14 * scale} 
          fontStyle="bold" 
          fill="#1e293b"
        />
        
        {/* Page content based on type */}
        {page.type === 'floorPlan' && renderFloorPlan(margin, contentY, contentWidth, contentHeight, getPageElements())}
        
        {page.type === 'itemsList' && renderItemsList(margin, contentY, contentWidth, contentHeight)}
        
        {page.type === 'elevation' && renderElevation(margin, contentY, contentWidth, contentHeight, page.wallId)}
        
        {/* Title block at bottom */}
        {renderTitleBlock(
          margin, 
          paper.height * scale - margin - titleBlockHeight, 
          contentWidth, 
          titleBlockHeight
        )}
      </Group>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-600 relative flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
        <h3 className="text-white font-semibold">📄 Drawing Layout</h3>
        
        {/* Paper Size */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Paper Size</label>
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
            className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white"
          >
            {Object.keys(PAPER_SIZES).map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        
        {/* Orientation */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Orientation</label>
          <div className="flex gap-2">
            <button
              onClick={() => setOrientation('portrait')}
              className={`flex-1 py-1.5 rounded text-xs font-medium ${
                orientation === 'portrait' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`flex-1 py-1.5 rounded text-xs font-medium ${
                orientation === 'landscape' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Landscape
            </button>
          </div>
        </div>

        {/* Pages */}
        <div>
          <label className="text-xs text-slate-400 block mb-2">Pages ({pages.length})</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {pages.map((page, i) => (
              <div 
                key={page.id}
                className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer ${
                  currentPage === i ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                onClick={() => setCurrentPage(i)}
              >
                <span>{i + 1}. {page.title}</span>
                {pages.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                    className="text-red-400 hover:text-red-300 px-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Page Header Title - Custom title for current page */}
          <div className="mt-3">
            <label className="text-xs text-slate-400 block mb-1">Page Header Title</label>
            <input
              type="text"
              value={pages[currentPage]?.headerTitle || ''}
              onChange={(e) => {
                const newPages = [...pages];
                newPages[currentPage] = { ...newPages[currentPage], headerTitle: e.target.value };
                setPages(newPages);
              }}
              placeholder={titleBlock.projectName || 'Enter page title...'}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white"
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty to use Project Name</p>
          </div>
        </div>
        
        {/* Title Block Info */}
        <div className="border-t border-slate-700 pt-3">
          <label className="text-xs text-slate-400 block mb-2">Title Block</label>
          <div className="space-y-2">
            <input
              type="text"
              value={titleBlock.companyName}
              onChange={(e) => setTitleBlock({ ...titleBlock, companyName: e.target.value })}
              placeholder="Company Name"
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white"
            />
            <input
              type="text"
              value={titleBlock.projectName}
              onChange={(e) => setTitleBlock({ ...titleBlock, projectName: e.target.value })}
              placeholder="Project Name"
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white"
            />
            <input
              type="text"
              value={titleBlock.customerName}
              onChange={(e) => setTitleBlock({ ...titleBlock, customerName: e.target.value })}
              placeholder="Customer Name"
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white"
            />
            <input
              type="text"
              value={titleBlock.designerName}
              onChange={(e) => setTitleBlock({ ...titleBlock, designerName: e.target.value })}
              placeholder="Designer Name"
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white"
            />
            <input
              type="text"
              value={titleBlock.scale}
              onChange={(e) => setTitleBlock({ ...titleBlock, scale: e.target.value })}
              placeholder="Scale (1:50)"
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white"
            />
          </div>
        </div>
        
        {/* Export Actions */}
        <div className="mt-auto space-y-2 border-t border-slate-700 pt-3">
          <button
            onClick={() => window.print()}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded flex items-center justify-center gap-2"
          >
            🖨️ Print
          </button>
          <button
            onClick={exportCurrentPageToPDF}
            disabled={isExporting}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 text-white text-sm font-medium rounded flex items-center justify-center gap-2"
          >
            📄 Export This Page
          </button>
          <button
            onClick={exportAllPagesToPDF}
            disabled={isExporting}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white text-sm font-medium rounded flex items-center justify-center gap-2"
          >
            {isExporting ? '⏳ Exporting...' : `📑 Export All ${pages.length} Pages`}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-slate-500">
        {/* Page navigation */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-sm"
          >
            ← Prev
          </button>
          <span className="text-white font-medium">
            Page {currentPage + 1} of {pages.length}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
            disabled={currentPage === pages.length - 1}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-sm"
          >
            Next →
          </button>
        </div>

        {/* Zoom controls for HD view */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
          >
            −
          </button>
          <span className="text-white text-sm min-w-[60px] text-center">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.25))}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
          >
            +
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs ml-2"
          >
            100%
          </button>
          <button
            onClick={() => setZoomLevel(2)}
            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs"
          >
            HD
          </button>
          <button
            onClick={() => setZoomLevel(4)}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs"
          >
            4K
          </button>
        </div>

        {/* Paper preview - HD quality with zoom */}
        <div 
          className="shadow-2xl overflow-auto max-h-[calc(100vh-450px)]"
          style={{ 
            maxWidth: '100%',
          }}
        >
          <Stage
            ref={stageRef}
            width={paper.width * scale * zoomLevel}
            height={paper.height * scale * zoomLevel}
            scaleX={zoomLevel}
            scaleY={zoomLevel}
            style={{ 
              background: '#fff', 
              borderRadius: 4,
              imageRendering: 'high-quality',
            }}
            // High pixel ratio for crisp HD/4K rendering
            pixelRatio={Math.max(2, zoomLevel)}
          >
            <KonvaLayer imageSmoothingEnabled={true}>
              {/* Paper background */}
              <Rect
                width={paper.width * scale}
                height={paper.height * scale}
                fill="#ffffff"
              />
              
              {/* Border */}
              <Rect
                x={5}
                y={5}
                width={paper.width * scale - 10}
                height={paper.height * scale - 10}
                stroke="#000"
                strokeWidth={1}
              />
              
              {/* Page content */}
              {renderPageContent()}
            </KonvaLayer>
          </Stage>
        </div>
        
        {/* Paper info */}
        <div className="mt-3 text-slate-300 text-xs">
          {paperSize} {orientation} • {paper.width}×{paper.height}mm • Zoom: {Math.round(zoomLevel * 100)}%
        </div>
      </div>
    </div>
  );
};
