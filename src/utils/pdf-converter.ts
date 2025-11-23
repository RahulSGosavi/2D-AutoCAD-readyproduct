// src/utils/pdf-converter.ts
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
if (typeof window !== 'undefined') {
  // Use jsDelivr CDN - most reliable option
  // Try .mjs first (newer format), fallback to legacy .js if needed
  const workerUrls = [
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs`,
    `https://unpkg.com/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/legacy/build/pdf.worker.min.mjs`,
  ];
  
  // Set the primary worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrls[0];
}

export interface PDFPageData {
  pageNumber: number;
  imageData: string; // Base64 data URL
  width: number;
  height: number;
}

/**
 * Convert PDF file to image data
 */
export const convertPDFToImages = async (file: File): Promise<PDFPageData[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: PDFPageData[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      // Use high DPI scale for full HD quality (4.0 = 4x resolution for crisp rendering)
      const viewport = page.getViewport({ scale: 4.0 });

      // Create canvas to render PDF page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Enable high-quality image rendering
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to high-quality image data URL
      // Use PNG format for lossless quality, with maximum quality
      const imageData = canvas.toDataURL('image/png', 1.0);

      pages.push({
        pageNumber: pageNum,
        imageData,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return pages;
  } catch (error) {
    throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Convert PDF to single image (first page or combined)
 */
export const convertPDFToImage = async (file: File, pageNumber: number = 1): Promise<PDFPageData | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Page number ${pageNumber} is out of range (1-${pdf.numPages})`);
    }

    const page = await pdf.getPage(pageNumber);
    // Use high DPI scale for full HD quality (4.0 = 4x resolution for crisp rendering)
    const viewport = page.getViewport({ scale: 4.0 });

    // Create canvas to render PDF page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Enable high-quality image rendering
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Convert canvas to high-quality image data URL
    // Use PNG format for lossless quality, with maximum quality
    const imageData = canvas.toDataURL('image/png', 1.0);

    return {
      pageNumber,
      imageData,
      width: viewport.width,
      height: viewport.height,
    };
  } catch (error) {
    throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

