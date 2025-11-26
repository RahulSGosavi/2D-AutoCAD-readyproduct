import type { EditorElement, Layer } from '../../state/useEditorStore';

export interface SharePayload {
  layers: Layer[];
  elements: EditorElement[];
  activeLayerId: string;
  notes?: string;
}

export const shareLinkService = {
  createLink(payload: SharePayload): string {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return `${window.location.origin}/?share=${encoded}`;
  },
  parseLink(token: string): SharePayload | null {
    try {
      const decoded = decodeURIComponent(escape(atob(token)));
      return JSON.parse(decoded) as SharePayload;
    } catch (error) {
      console.error('Failed to parse share link', error);
      return null;
    }
  },
};

