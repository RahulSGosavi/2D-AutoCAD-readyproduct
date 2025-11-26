import type { EditorElement, Layer } from '../state/useEditorStore';
import { convertPDFToImage } from './pdf-converter';
import { convertPDFToVectorElements } from './pdf-to-vector';

export interface ProjectData {
  layers: Layer[];
  elements: EditorElement[];
  activeLayerId: string;
  snapSettings?: any;
}

/**
 * Load project data from a JSON file
 */
export const loadProjectFromJSON = async (file: File): Promise<ProjectData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ProjectData;
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Load SVG file and convert to project data
 */
export const loadProjectFromSVG = async (file: File): Promise<ProjectData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const svgText = e.target?.result as string;
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        
        // Basic SVG parsing - extract paths and shapes
        // This is a simplified version; you may want to enhance it
        const elements: EditorElement[] = [];
        const paths = svgDoc.querySelectorAll('path, line, rect, circle, ellipse');
        
        paths.forEach((node, index) => {
          // Convert SVG elements to our format
          // This is a placeholder - you'll need to implement proper conversion
          const id = `imported-${index}`;
          // Add conversion logic here based on your needs
        });
        
        resolve({
          layers: [{ id: 'imported-layer', name: 'Imported Layer', visible: true, locked: false }],
          elements,
          activeLayerId: 'imported-layer',
        });
      } catch (error) {
        reject(new Error('Failed to parse SVG file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read SVG file'));
    reader.readAsText(file);
  });
};

/**
 * Handle local file upload
 */
export const handleLocalFileUpload = (
  accept: string = '.json,.svg,.pdf',
  onLoad: (data: ProjectData) => void,
  onError: (error: string) => void,
  onPdfLoad?: (imageData: string, width: number, height: number) => void,
) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      if (file.name.endsWith('.pdf')) {
        // Handle PDF file
        const pdfPage = await convertPDFToImage(file, 1); // Convert first page
        if (pdfPage && onPdfLoad) {
          onPdfLoad(pdfPage.imageData, pdfPage.width, pdfPage.height);
        } else {
          throw new Error('Failed to convert PDF');
        }
        return;
      }
      
      let data: ProjectData;
      if (file.name.endsWith('.json')) {
        data = await loadProjectFromJSON(file);
      } else if (file.name.endsWith('.svg')) {
        data = await loadProjectFromSVG(file);
      } else {
        throw new Error('Unsupported file format');
      }
      onLoad(data);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed');
    }
  };
  input.click();
};

/**
 * Import PDF and convert to editable vector elements
 */
export const importPDFAsVectors = async (
  file: File,
  layerId: string,
  options: {
    pageNumber?: number;
    scale?: number;
    alsoLoadAsBackground?: boolean;
  } = {}
): Promise<{
  elements: EditorElement[];
  backgroundImage?: string;
  width: number;
  height: number;
  pageCount: number;
}> => {
  const { pageNumber = 1, scale = 1, alsoLoadAsBackground = true } = options;
  
  // Convert PDF to vector elements
  const result = await convertPDFToVectorElements(file, layerId, pageNumber, scale);
  
  let backgroundImage: string | undefined;
  
  // Also load as background image for reference
  if (alsoLoadAsBackground) {
    const pdfPage = await convertPDFToImage(file, pageNumber);
    if (pdfPage) {
      backgroundImage = pdfPage.imageData;
    }
  }
  
  return {
    elements: result.elements,
    backgroundImage,
    width: result.width,
    height: result.height,
    pageCount: result.pageCount,
  };
};

/**
 * Handle PDF file upload with vector conversion option
 */
export const handlePDFUploadWithVectors = (
  onLoad: (data: {
    elements: EditorElement[];
    backgroundImage?: string;
    width: number;
    height: number;
    pageCount: number;
  }) => void,
  onError: (error: string) => void,
  layerId: string,
  options?: {
    pageNumber?: number;
    scale?: number;
    alsoLoadAsBackground?: boolean;
  }
) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const result = await importPDFAsVectors(file, layerId, options);
      onLoad(result);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'PDF import failed');
    }
  };
  input.click();
};

/**
 * Google Drive Picker API integration
 */
declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void;
      picker?: {
        ViewId: {
          DOCS: string;
          DOCS_IMAGES: string;
          DOCUMENTS: string;
          SPREADSHEETS: string;
          PDFS: string;
          IMAGES: string;
          VIDEO: string;
        };
        Action: {
          PICKED: string;
          CANCEL: string;
        };
        DocsView: new (viewId: string) => {
          setMimeTypes: (mimeTypes: string) => void;
          setIncludeFolders: (include: boolean) => void;
        };
        PickerBuilder: new () => {
          setAppId: (appId: string) => this;
          setOAuthToken: (token: string) => this;
          setDeveloperKey: (key: string) => this;
          setCallback: (callback: (data: any) => void) => this;
          setOrigin: (origin: string) => this;
          addView: (view: any) => this;
          enableFeature: (feature: string) => this;
          build: () => { setVisible: (visible: boolean) => void };
        };
      };
    };
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (token: string) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

let googleApiLoaded = false;
let googlePickerReady = false;

/**
 * Load Google Picker API
 */
export const loadGooglePickerAPI = (apiKey: string, clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (googleApiLoaded && googlePickerReady) {
      resolve();
      return;
    }

    // Load Google API script
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi?.load('picker', () => {
          googlePickerReady = true;
          resolve();
        });
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    } else {
      window.gapi.load('picker', () => {
        googlePickerReady = true;
        resolve();
      });
    }
    googleApiLoaded = true;
  });
};

/**
 * Open Google Drive Picker
 */
export const openGoogleDrivePicker = (
  apiKey: string,
  clientId: string,
  onFileSelected: (file: File) => void,
  onError: (error: string) => void,
) => {
  if (!window.google || !window.gapi?.picker) {
    onError('Google API not loaded. Please check API key and client ID.');
    return;
  }

  // Get OAuth token
  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    callback: (token: string) => {
      if (!token) {
        onError('Failed to authenticate with Google');
        return;
      }

      // Create picker
      const view = new window.gapi.picker.DocsView(window.gapi.picker.ViewId.DOCS);
      view.setMimeTypes('application/json,image/svg+xml');
      view.setIncludeFolders(true);

      const picker = new window.gapi.picker.PickerBuilder()
        .setAppId(clientId)
        .setOAuthToken(token)
        .setDeveloperKey(apiKey)
        .setCallback((data: any) => {
          if (data.action === window.gapi.picker.Action.PICKED) {
            const fileId = data.docs[0].id;
            const fileName = data.docs[0].name;
            // Fetch file content
            fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
              .then((response) => response.blob())
              .then((blob) => {
                const file = new File([blob], fileName, { type: blob.type });
                onFileSelected(file);
              })
              .catch((error) => {
                onError(`Failed to download file: ${error.message}`);
              });
          }
        })
        .addView(view)
        .setOrigin(window.location.origin)
        .build();
      
      picker.setVisible(true);
    },
  });

  tokenClient.requestAccessToken();
};

/**
 * Unified file upload handler
 */
export const handleFileUpload = (
  source: 'local' | 'google',
  onLoad: (data: ProjectData) => void,
  onError: (error: string) => void,
  googleConfig?: { apiKey: string; clientId: string },
) => {
  if (source === 'local') {
    handleLocalFileUpload('.json,.svg', onLoad, onError);
  } else if (source === 'google' && googleConfig) {
    loadGooglePickerAPI(googleConfig.apiKey, googleConfig.clientId)
      .then(() => {
        openGoogleDrivePicker(
          googleConfig.apiKey,
          googleConfig.clientId,
          async (file) => {
            try {
              let data: ProjectData;
              if (file.name.endsWith('.json')) {
                data = await loadProjectFromJSON(file);
              } else if (file.name.endsWith('.svg')) {
                data = await loadProjectFromSVG(file);
              } else {
                throw new Error('Unsupported file format');
              }
              onLoad(data);
            } catch (error) {
              onError(error instanceof Error ? error.message : 'Upload failed');
            }
          },
          onError,
        );
      })
      .catch((error) => {
        onError(`Failed to load Google Picker: ${error.message}`);
      });
  }
};

