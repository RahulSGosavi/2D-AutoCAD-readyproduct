import { useEffect, useRef, useState } from 'react';
import { realtimeCollaborationService, type CollaborationMessage } from '../services/collaboration/realtimeService';
import { useEditorStore } from '../state/useEditorStore';

export interface RemotePresence {
  userId: string;
  pointer: { x: number; y: number };
  selectedIds: string[];
  lastSeen: number;
}

export const useRealtimeCollaboration = (sessionId: string) => {
  const pointer = useEditorStore((state) => state.pointer);
  const selectedElementIds = useEditorStore((state) => state.selectedElementIds);
  const [remotes, setRemotes] = useState<Record<string, RemotePresence>>({});
  const lastBroadcastRef = useRef(0);

  useEffect(() => {
    realtimeCollaborationService.connect(sessionId);
    const unsubscribe = realtimeCollaborationService.onMessage((message: CollaborationMessage) => {
      if (message.type === 'presence') {
        setRemotes((prev) => ({
          ...prev,
          [message.userId]: {
            userId: message.userId,
            pointer: message.pointer,
            selectedIds: message.selectedIds,
            lastSeen: message.timestamp,
          },
        }));
      }
    });
    return () => {
      unsubscribe();
      realtimeCollaborationService.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    const now = Date.now();
    if (now - lastBroadcastRef.current < 100) {
      return;
    }
    lastBroadcastRef.current = now;
    realtimeCollaborationService.publish({
      type: 'presence',
      pointer,
      selectedIds: selectedElementIds,
    });
  }, [pointer, selectedElementIds]);

  const presenceList = Object.values(remotes).filter((presence) => Date.now() - presence.lastSeen < 5000);

  return {
    presence: presenceList,
  };
};

