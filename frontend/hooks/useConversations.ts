import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types/conversation';
import { conversationsApi } from '../services/api/conversations';
import { socketClient } from '../services/websocket/socketClient';
import { WSEvent } from '../types/websocket';

export function useConversations(activeConvId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await conversationsApi.getConversations();
      setConversations(data);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time WebSocket events
  useEffect(() => {
    const handleWSEvent = (event: WSEvent) => {
      if (event.event === 'NEW_MESSAGE') {
        const msg = event.data;
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === msg.conversation_id);
          if (index === -1) {
            // Re-fetch conversation list if conversation not present locally
            fetchConversations();
            return prev;
          }

          const updated = [...prev];
          const conv = { ...updated[index] };
          conv.last_message = msg;
          conv.last_message_id = msg.id;
          conv.last_activity_at = msg.created_at;

          // Increment unread count if not active conversation
          if (activeConvId !== conv.id) {
            conv.unread_count = (conv.unread_count || 0) + 1;
          }

          updated[index] = conv;
          // Re-sort by last_activity_at desc
          return updated.sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime());
        });
      }
    };

    const unsubscribe = socketClient.subscribe(handleWSEvent);
    return () => unsubscribe();
  }, [activeConvId, fetchConversations]);

  const markConversationRead = useCallback(async (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
    );
    try {
      await conversationsApi.markAsRead(convId);
      socketClient.send('MARK_READ', { conversation_id: convId });
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  }, []);

  return {
    conversations,
    isLoading,
    refreshConversations: fetchConversations,
    markConversationRead,
  };
}
