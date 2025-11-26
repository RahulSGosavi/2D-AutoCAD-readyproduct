// src/utils/pdf-to-vector.ts
// Convert PDF vector paths to editable canvas elements

import * as pdfjsLib from 'pdfjs-dist';
import type { EditorElement } from '../state/useEditorStore';
import { nanoid } from 'nanoid';

// Set worker source for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs`;
}

export interface PDFVectorResult {
  elements: EditorElement[];
  width: number;
  height: number;
  pageCount: number;
}

interface PathCommand {
  type: 'M' | 'L' | 'C' | 'Q' | 'Z' | 'H' | 'V';
  points: number[];
}

/**
 * Extract vector paths and text from PDF and convert to editable elements
 */
export const convertPDFToVectorElements = async (
  file: File,
  layerId: string,
  pageNumber: number = 1,
  scale: number = 1
): Promise<PDFVectorResult> => {
  const elements: EditorElement[] = [];
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Page ${pageNumber} out of range (1-${pdf.numPages})`);
    }
    
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    // Get operator list (contains all drawing commands)
    const operatorList = await page.getOperatorList();
    
    // Get text content
    const textContent = await page.getTextContent();
    
    // Process drawing operations
    let currentPath: number[] = [];
    let currentX = 0;
    let currentY = 0;
    let strokeColor = '#000000';
    let fillColor = '#ffffff';
    let lineWidth = 1;
    
    const OPS = pdfjsLib.OPS;
    
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];
      
      switch (fn) {
        case OPS.setStrokeRGBColor:
          if (args && args.length >= 3) {
            strokeColor = rgbToHex(args[0], args[1], args[2]);
          }
          break;
          
        case OPS.setFillRGBColor:
          if (args && args.length >= 3) {
            fillColor = rgbToHex(args[0], args[1], args[2]);
          }
          break;
          
        case OPS.setLineWidth:
          if (args && args.length >= 1) {
            lineWidth = args[0] * scale;
          }
          break;
          
        case OPS.moveTo:
          if (args && args.length >= 2) {
            currentX = args[0] * scale;
            currentY = viewport.height - args[1] * scale; // Flip Y
            currentPath = [currentX, currentY];
          }
          break;
          
        case OPS.lineTo:
          if (args && args.length >= 2) {
            currentX = args[0] * scale;
            currentY = viewport.height - args[1] * scale;
            currentPath.push(currentX, currentY);
          }
          break;
          
        case OPS.rectangle:
          if (args && args.length >= 4) {
            const x = args[0] * scale;
            const y = viewport.height - (args[1] + args[3]) * scale;
            const w = args[2] * scale;
            const h = args[3] * scale;
            
            elements.push({
              id: nanoid(),
              type: 'rectangle',
              layerId,
              x,
              y,
              width: w,
              height: h,
              stroke: strokeColor,
              strokeWidth: lineWidth,
              fill: fillColor,
              opacity: 1,
              rotation: 0,
            } as EditorElement);
          }
          break;
          
        case OPS.stroke:
        case OPS.closeStroke:
          if (currentPath.length >= 4) {
            elements.push({
              id: nanoid(),
              type: 'polyline',
              layerId,
              points: [...currentPath],
              stroke: strokeColor,
              strokeWidth: lineWidth,
              opacity: 1,
              rotation: 0,
              x: 0,
              y: 0,
              closed: fn === OPS.closeStroke,
            } as EditorElement);
          }
          currentPath = [];
          break;
          
        case OPS.fill:
        case OPS.closeFill:
        case OPS.fillStroke:
          if (currentPath.length >= 4) {
            elements.push({
              id: nanoid(),
              type: 'polyline',
              layerId,
              points: [...currentPath],
              stroke: strokeColor,
              strokeWidth: lineWidth,
              fill: fillColor,
              opacity: 1,
              rotation: 0,
              x: 0,
              y: 0,
              closed: true,
            } as EditorElement);
          }
          currentPath = [];
          break;
      }
    }
    
    // Convert text items to text elements
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const textItem = item as any;
        const transform = textItem.transform || [1, 0, 0, 1, 0, 0];
        const x = transform[4] * scale;
        const y = viewport.height - transform[5] * scale;
        const fontSize = Math.abs(transform[0]) * scale || 12;
        
        elements.push({
          id: nanoid(),
          type: 'text',
          layerId,
          x,
          y,
          text: textItem.str,
          fontSize,
          fontFamily: textItem.fontName || 'Arial',
          stroke: '#000000',
          strokeWidth: 0,
          opacity: 1,
          rotation: 0,
        } as EditorElement);
      }
    }
    
    return {
      elements,
      width: viewport.width,
      height: viewport.height,
      pageCount: pdf.numPages,
    };
    
  } catch (error) {
    console.error('PDF to vector conversion error:', error);
    throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Convert RGB values (0-1) to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => {
    const hex = Math.round(v * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Import PDF as background image (existing behavior) + extract vectors
 */
export const importPDFWithVectors = async (
  file: File,
  layerId: string,
  options: {
    extractVectors?: boolean;
    keepAsBackground?: boolean;
    pageNumber?: number;
    scale?: number;
  } = {}
): Promise<{
  elements: EditorElement[];
  backgroundImage?: string;
  width: number;
  height: number;
}> => {
  const {
    extractVectors = true,
    keepAsBackground = true,
    pageNumber = 1,
    scale = 1,
  } = options;
  
  let elements: EditorElement[] = [];
  let backgroundImage: string | undefined;
  let width = 0;
  let height = 0;
  
  // Extract vectors if requested
  if (extractVectors) {
    const result = await convertPDFToVectorElements(file, layerId, pageNumber, scale);
    elements = result.elements;
    width = result.width;
    height = result.height;
  }
  
  // Also render as background image if requested
  if (keepAsBackground) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: scale * 2 }); // Higher res for background
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      await page.render({ canvasContext: context, viewport }).promise;
      backgroundImage = canvas.toDataURL('image/png', 1.0);
      
      if (!width) width = viewport.width / 2;
      if (!height) height = viewport.height / 2;
    }
  }
  
  return { elements, backgroundImage, width, height };
};

