// src/components/PDFPageChanger.tsx
import React from 'react';
import { useEditorStore } from '../state/useEditorStore';

export const PDFPageChanger: React.FC = () => {
  const { pdfBackground, updatePdfBackground, setStageTransform, stageInstance } = useEditorStore();

  if (!pdfBackground || pdfBackground.totalPages <= 1) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pdfBackground.totalPages) return;
    
    const pageData = pdfBackground.pages.find(p => p.pageNumber === newPage);
    if (!pageData) return;

    // Calculate fit-to-view scale and position for the new page
    // PDF is rendered at 4x scale, so divide by 4 to get display size
    const displayWidth = pageData.width / 4;
    const displayHeight = pageData.height / 4;
    const canvasWidth = stageInstance?.width() || window.innerWidth;
    const canvasHeight = stageInstance?.height() || window.innerHeight;
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / displayHeight;
    const fitScale = Math.min(scaleX, scaleY); // Use full scale to cover canvas
    
    // Calculate scaled dimensions
    const scaledWidth = displayWidth * fitScale;
    const scaledHeight = displayHeight * fitScale;
    
    // Center the PDF in the canvas
    const centerX = (canvasWidth - scaledWidth) / 2;
    const centerY = (canvasHeight - scaledHeight) / 2;

    updatePdfBackground({
      currentPage: newPage,
      imageData: pageData.imageData,
      width: displayWidth, // Display at 1x size
      height: displayHeight, // Display at 1x size
      x: 0, // Start at origin in stage coordinates
      y: 0, // Start at origin in stage coordinates
    });

    // Auto-fit and center the view to show the new page
    setStageTransform({
      scale: fitScale,
      position: { x: centerX, y: centerY },
    });
  };

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white rounded-lg shadow-lg p-3 z-50 border border-slate-600">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(pdfBackground.currentPage - 1)}
          disabled={pdfBackground.currentPage <= 1}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous Page"
        >
          ‹
        </button>
        <span className="px-3 py-1 text-sm">
          Page {pdfBackground.currentPage} of {pdfBackground.totalPages}
        </span>
        <button
          onClick={() => handlePageChange(pdfBackground.currentPage + 1)}
          disabled={pdfBackground.currentPage >= pdfBackground.totalPages}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next Page"
        >
          ›
        </button>
      </div>
      {pdfBackground.totalPages > 2 && (
        <div className="mt-2 flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={pdfBackground.totalPages}
            value={pdfBackground.currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value, 10);
              if (!isNaN(page)) {
                handlePageChange(page);
              }
            }}
            className="w-16 px-2 py-1 bg-slate-700 text-white rounded text-sm text-center"
          />
          <span className="text-xs text-slate-400">/ {pdfBackground.totalPages}</span>
        </div>
      )}
    </div>
  );
};

