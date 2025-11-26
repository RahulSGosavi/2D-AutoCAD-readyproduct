// src/components/modern/BottomBar.tsx
import React, { useRef, useState } from 'react';
import { useEditorStore } from '../../state/useEditorStore';
import { useThemeStore } from '../../state/useThemeStore';
import { exportStageToPDF, exportStageToPNG, exportPDFWithDrawings } from '../../utils/exporters';
import { handlePDFUploadWithVectors } from '../../utils/file-upload';
import {
  Undo2,
  Redo2,
  Sun,
  Moon,
  Download,
  Upload,
  Grid3X3,
  Magnet,
  FileText,
  Image,
  FileJson,
  ShieldAlert,
  Link,
  Compass,
  Home,
  PanelTop,
  FileStack,
  FileEdit,
} from 'lucide-react';

const units = ['mm', 'cm', 'm', 'in', 'ft'];

export const BottomBar: React.FC = () => {
  const { 
    undo, 
    redo,
    canUndo,
    canRedo,
    drawingSettings,
    setDrawingSettings,
    snapSettings,
    setSnapSettings,
    setPdfBackground,
    stageScale,
    tool,
    stageInstance,
    elements,
    pdfBackground,
    viewMode,
    setViewMode,
    setFloorPlanSnapshot,
    floorPlanStage,
  } = useEditorStore();
  const { setTheme, resolvedTheme } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const isDark = resolvedTheme === 'dark';

  const bgColor = isDark ? '#0f172a' : '#f1f5f9';
  const borderColor = isDark ? '#334155' : '#cbd5e1';
  const textColor = isDark ? '#e2e8f0' : '#334155';
  const mutedColor = isDark ? '#64748b' : '#94a3b8';

  const [showImportMenu, setShowImportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { activeLayerId, addElement } = useEditorStore();

  const handleImportPDF = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    
    try {
      const { convertPDFToImages } = await import('../../utils/pdf-converter');
      const pdfPages = await convertPDFToImages(file);
      
      if (pdfPages && pdfPages.length > 0) {
        const firstPage = pdfPages[0];
        // PDF is rendered at 4x scale for HD quality, display at 1x
        const displayWidth = firstPage.width / 4;
        const displayHeight = firstPage.height / 4;
        const canvasWidth = stageInstance?.width() || window.innerWidth;
        const canvasHeight = stageInstance?.height() || window.innerHeight;
        const scaleX = canvasWidth / displayWidth;
        const scaleY = canvasHeight / displayHeight;
        const fitScale = Math.min(scaleX, scaleY) * 0.9; // 90% to add margin
        
        // Center the PDF
        const scaledWidth = displayWidth * fitScale;
        const scaledHeight = displayHeight * fitScale;
        const centerX = (canvasWidth - scaledWidth) / 2;
        const centerY = (canvasHeight - scaledHeight) / 2;
        
        setPdfBackground({
          imageData: firstPage.imageData,
          width: displayWidth,
          height: displayHeight,
          x: 0,
          y: 0,
          opacity: 1, // Full opacity for clear view
          visible: true,
          currentPage: 1,
          totalPages: pdfPages.length,
          pages: pdfPages,
        });
        
        // Auto-fit and center
        const { setStageTransform } = useEditorStore.getState();
        setStageTransform({
          scale: fitScale,
          position: { x: centerX, y: centerY },
        });
      }
    } catch (error) {
      alert(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    e.target.value = '';
  };

  // Import PDF and convert to editable vectors
  const handleImportPDFAsVectors = () => {
    setShowImportMenu(false);
    handlePDFUploadWithVectors(
      (result) => {
        // Add all extracted elements to canvas
        result.elements.forEach((element) => {
          addElement(element);
        });
        
        // Optionally also set as background for reference
        if (result.backgroundImage) {
          setPdfBackground({
            imageData: result.backgroundImage,
            width: result.width,
            height: result.height,
            x: 0,
            y: 0,
            opacity: 0.3, // Semi-transparent background
            visible: true,
            currentPage: 1,
            totalPages: result.pageCount,
            pages: [],
          });
        }
        
        alert(`Imported ${result.elements.length} elements from PDF!`);
      },
      (error) => {
        alert(`Failed to import PDF: ${error}`);
      },
      activeLayerId,
      { scale: 1, alsoLoadAsBackground: true }
    );
  };

  const handleExportJSON = () => {
    const data = {
      elements: useEditorStore.getState().elements,
      layers: useEditorStore.getState().layers,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kab-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = async (currentPageOnly = false) => {
    if (!stageInstance) {
      alert('Canvas not ready. Please try again.');
      return;
    }
    
    setShowExportMenu(false);
    setIsExporting(true);
    
    // Small delay to show loading overlay before export starts
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // If PDF background is loaded, export PDF with drawings
      if (pdfBackground && pdfBackground.pages && pdfBackground.pages.length > 0) {
        const filename = currentPageOnly 
          ? `drawing-page${pdfBackground.currentPage}.pdf`
          : 'drawing-all-pages.pdf';
        await exportPDFWithDrawings(
          stageInstance,
          pdfBackground,
          elements,
          filename,
          currentPageOnly
        );
      } else {
        // Regular single page export
        exportStageToPDF(stageInstance, 'drawing-4k.pdf');
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
    setIsExporting(false);
  };

  const handleExportPNG = async () => {
    if (!stageInstance) {
      alert('Canvas not ready. Please try again.');
      return;
    }
    
    setShowExportMenu(false);
    setIsExporting(true);
    
    // Small delay to show loading overlay before export starts
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      await exportStageToPNG(stageInstance, 'drawing-4k.png', 3840);
    } catch (error) {
      console.error('Failed to export PNG:', error);
      alert('Failed to export PNG. Please try again.');
    }
    setIsExporting(false);
  };

  const toolLabels: Record<string, string> = {
    select: 'Select', pan: 'Pan', line: 'Line', rectangle: 'Rectangle',
    circle: 'Circle', pencil: 'Freehand', text: 'Text', wall: 'Wall',
    door: 'Door', window: 'Window', dimension: 'Dimension', erase: 'Erase',
  };

  const zoomPercent = Math.round((stageScale || 1) * 100);

  return (
    <>
      {/* Export Loading Overlay */}
      {isExporting && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
        >
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-white text-lg font-medium">Exporting...</div>
            <div className="text-slate-400 text-sm">Please wait while your drawing is being exported</div>
          </div>
        </div>
      )}
      
      <div
        className="flex items-center justify-between px-3 z-50"
        style={{
          height: 28,
          backgroundColor: bgColor,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
      {/* Left: View Mode Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setViewMode('floorPlan')}
          title="Floor Plan View"
          className="flex items-center gap-1 px-2 py-1 rounded transition-all"
          style={{
            fontSize: 11,
            color: viewMode === 'floorPlan' ? '#0ea5e9' : mutedColor,
            backgroundColor: viewMode === 'floorPlan' ? (isDark ? '#0ea5e920' : '#0ea5e915') : 'transparent',
            fontWeight: viewMode === 'floorPlan' ? 600 : 400,
          }}
        >
          <Home size={12} />
          <span>Floor Plan</span>
        </button>
        <button
          onClick={() => {
            // Capture floor plan snapshot BEFORE switching to layout view
            const stage = floorPlanStage || stageInstance;
            if (viewMode === 'floorPlan' && stage) {
              try {
                // Force a re-render and capture after a tiny delay
                stage.batchDraw();
                setTimeout(() => {
                  const dataUrl = stage.toDataURL({ 
                    pixelRatio: 2,
                    mimeType: 'image/png',
                    quality: 1
                  });
                  setFloorPlanSnapshot(dataUrl);
                  setViewMode('drawingLayout');
                }, 100);
                return; // Don't setViewMode yet, wait for timeout
              } catch (e) {
                console.log('Could not capture floor plan');
              }
            }
            setViewMode('drawingLayout');
          }}
          title="Drawing Layout"
          className="flex items-center gap-1 px-2 py-1 rounded transition-all"
          style={{
            fontSize: 11,
            color: viewMode === 'drawingLayout' ? '#8b5cf6' : mutedColor,
            backgroundColor: viewMode === 'drawingLayout' ? (isDark ? '#8b5cf620' : '#8b5cf615') : 'transparent',
            fontWeight: viewMode === 'drawingLayout' ? 600 : 400,
          }}
        >
          <FileStack size={12} />
          <span>Layout</span>
        </button>
        
        <div style={{ width: 1, height: 16, backgroundColor: borderColor, margin: '0 8px' }} />
        
        <span style={{ fontSize: 11, color: isDark ? '#0ea5e9' : '#0284c7', fontWeight: 500 }}>
          {toolLabels[tool] || tool}
        </span>
        <span style={{ fontSize: 11, color: mutedColor }}>Zoom: {zoomPercent}%</span>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-1">
        {/* Grid Toggle */}
        <button
          onClick={() => setSnapSettings({ ...snapSettings, showGrid: !snapSettings.showGrid })}
          title="Toggle Grid"
          className="flex items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: 4,
            color: snapSettings.showGrid ? '#0ea5e9' : mutedColor,
            backgroundColor: snapSettings.showGrid ? (isDark ? '#0ea5e920' : '#0ea5e915') : 'transparent',
          }}
        >
          <Grid3X3 size={14} />
        </button>

        {/* Snap Toggle */}
        <button
          onClick={() => setSnapSettings({ ...snapSettings, snapToGrid: !snapSettings.snapToGrid })}
          title="Toggle Snap"
          className="flex items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: 4,
            color: snapSettings.snapToGrid ? '#8b5cf6' : mutedColor,
            backgroundColor: snapSettings.snapToGrid ? (isDark ? '#8b5cf620' : '#8b5cf615') : 'transparent',
          }}
        >
          <Magnet size={14} />
        </button>

        {/* Collision Toggle */}
        <button
          onClick={() => setSnapSettings({ ...snapSettings, collision: !snapSettings.collision })}
          title="Toggle Collision Detection"
          className="flex items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: 4,
            color: snapSettings.collision ? '#ef4444' : mutedColor,
            backgroundColor: snapSettings.collision ? (isDark ? '#ef444420' : '#ef444415') : 'transparent',
          }}
        >
          <ShieldAlert size={14} />
        </button>

        {/* Ortho Toggle */}
        <button
          onClick={() => setSnapSettings({ ...snapSettings, orthoMode: !snapSettings.orthoMode })}
          title="Toggle Ortho Mode (45° angles)"
          className="flex items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: 4,
            color: snapSettings.orthoMode ? '#10b981' : mutedColor,
            backgroundColor: snapSettings.orthoMode ? (isDark ? '#10b98120' : '#10b98115') : 'transparent',
          }}
        >
          <Compass size={14} />
        </button>

        {/* Link Toggle */}
        <button
          onClick={() => setSnapSettings({ ...snapSettings, linkMode: !snapSettings.linkMode })}
          title="Toggle Link Mode"
          className="flex items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: 4,
            color: snapSettings.linkMode ? '#f59e0b' : mutedColor,
            backgroundColor: snapSettings.linkMode ? (isDark ? '#f59e0b20' : '#f59e0b15') : 'transparent',
          }}
        >
          <Link size={14} />
        </button>

        <div style={{ width: 1, height: 16, backgroundColor: borderColor, margin: '0 4px' }} />

        {/* Undo/Redo */}
        <button
          onClick={() => undo()}
          disabled={!canUndo}
          title="Undo"
          className="flex items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: 4,
            color: canUndo ? textColor : mutedColor,
            opacity: canUndo ? 1 : 0.4,
          }}
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo}
          title="Redo"
          className="flex items-center justify-center"
          style={{
            width: 24, height: 24, borderRadius: 4,
            color: canRedo ? textColor : mutedColor,
            opacity: canRedo ? 1 : 0.4,
          }}
        >
          <Redo2 size={14} />
        </button>

        <div style={{ width: 1, height: 16, backgroundColor: borderColor, margin: '0 4px' }} />

        {/* Import/Export */}
        <div className="relative">
          <button 
            onClick={handleImportPDF} 
            title="Import PDF as Background" 
            className="flex items-center justify-center"
            style={{ 
              width: 24, 
              height: 24, 
              color: mutedColor,
              borderRadius: 4,
            }}
          >
            <Upload size={14} />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
        
        {/* Export Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)} 
            title="Export Drawing" 
            className="flex items-center justify-center"
            style={{ 
              width: 24, 
              height: 24, 
              color: showExportMenu ? '#0ea5e9' : mutedColor,
              backgroundColor: showExportMenu ? (isDark ? '#0ea5e920' : '#0ea5e915') : 'transparent',
              borderRadius: 4,
            }}
          >
            <Download size={14} />
          </button>
          
          {showExportMenu && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowExportMenu(false)}
              />
              
              {/* Export Menu */}
              <div 
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-xl overflow-hidden"
                style={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  minWidth: 180,
                }}
              >
                <div 
                  className="px-3 py-2 text-xs font-semibold"
                  style={{ 
                    color: mutedColor,
                    borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  }}
                >
                  Export Drawing
                </div>
                
                {pdfBackground && pdfBackground.pages && pdfBackground.pages.length > 1 ? (
                  <>
                    <button
                      onClick={() => handleExportPDF(true)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-opacity-10 transition-colors"
                      style={{ color: textColor, backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FileText size={16} style={{ color: '#f59e0b' }} />
                      <div className="text-left">
                        <div className="text-sm font-medium">PDF - Current Page ({pdfBackground.currentPage})</div>
                        <div className="text-xs" style={{ color: mutedColor }}>Export page {pdfBackground.currentPage} only</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExportPDF(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-opacity-10 transition-colors"
                      style={{ color: textColor, backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FileText size={16} style={{ color: '#ef4444' }} />
                      <div className="text-left">
                        <div className="text-sm font-medium">PDF - All Pages ({pdfBackground.totalPages})</div>
                        <div className="text-xs" style={{ color: mutedColor }}>Export all pages with drawings</div>
                      </div>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleExportPDF()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-opacity-10 transition-colors"
                    style={{ color: textColor, backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileText size={16} style={{ color: '#ef4444' }} />
                    <div className="text-left">
                      <div className="text-sm font-medium">PDF (4K Quality)</div>
                      <div className="text-xs" style={{ color: mutedColor }}>High resolution print</div>
                    </div>
                  </button>
                )}
                
                <button
                  onClick={handleExportPNG}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-opacity-10 transition-colors"
                  style={{ 
                    color: textColor,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Image size={16} style={{ color: '#22c55e' }} />
                  <div className="text-left">
                    <div className="text-sm font-medium">PNG (4K Image)</div>
                    <div className="text-xs" style={{ color: mutedColor }}>3840px resolution</div>
                  </div>
                </button>
                
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-opacity-10 transition-colors"
                  style={{ 
                    color: textColor,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <FileJson size={16} style={{ color: '#3b82f6' }} />
                  <div className="text-left">
                    <div className="text-sm font-medium">JSON (Project)</div>
                    <div className="text-xs" style={{ color: mutedColor }}>Backup / reopen later</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        <div style={{ width: 1, height: 16, backgroundColor: borderColor, margin: '0 4px' }} />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
          className="flex items-center justify-center"
          style={{ width: 24, height: 24, color: isDark ? '#fbbf24' : '#64748b' }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Right: Unit */}
        <div className="flex items-center gap-2" style={{ fontSize: 11 }}>
          <span style={{ color: mutedColor }}>Unit:</span>
          <select
            value={drawingSettings.unit || 'mm'}
            onChange={(e) => setDrawingSettings({ ...drawingSettings, unit: e.target.value as any })}
            style={{
              backgroundColor: 'transparent',
              color: textColor,
              border: 'none',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {units.map((u) => (
              <option key={u} value={u} style={{ backgroundColor: bgColor }}>{u.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};

