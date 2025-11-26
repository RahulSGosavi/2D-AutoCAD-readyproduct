import { nanoid } from 'nanoid';

export type CollaborationMessage =
  | {
      type: 'presence';
      sessionId: string;
      userId: string;
      pointer: { x: number; y: number };
      selectedIds: string[];
      timestamp: number;
    }
  | {
      type: 'chat';
      sessionId: string;
      userId: string;
      message: string;
      timestamp: number;
    };

export type PresenceListener = (payload: CollaborationMessage) => void;

export class RealtimeCollaborationService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<PresenceListener> = new Set();
  private sessionId: string = 'default';
  readonly clientId = nanoid();

  connect(sessionId: string) {
    this.sessionId = sessionId;
    if (typeof window === 'undefined') return;
    this.channel = new BroadcastChannel(`kab-collab-${sessionId}`);
    this.channel.onmessage = (event) => {
      const data = event.data as CollaborationMessage;
      if (data.userId === this.clientId) return;
      this.listeners.forEach((listener) => listener(data));
    };
  }

  disconnect() {
    this.channel?.close();
    this.channel = null;
    this.listeners.clear();
  }

  publish(message: Omit<CollaborationMessage, 'sessionId' | 'userId' | 'timestamp'>) {
    if (!this.channel) return;
    const payload: CollaborationMessage = {
      ...message,
      sessionId: this.sessionId,
      userId: this.clientId,
      timestamp: Date.now(),
    } as CollaborationMessage;
    this.channel.postMessage(payload);
  }

  onMessage(listener: PresenceListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const realtimeCollaborationService = new RealtimeCollaborationService();

