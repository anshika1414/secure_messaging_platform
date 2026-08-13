import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types/message';
import { conversationsApi } from '../services/api/conversations';
import { socketClient } from '../services/websocket/socketClient';
import { WSEvent, TypingPayload, ReceiptUpdatePayload } from '../types/websocket';

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // user_id -> display_name

  const fetchInitialMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await conversationsApi.getMessages(conversationId);
      setMessages(res.messages);
      setNextCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchInitialMessages();
    setTypingUsers(new Map());
  }, [fetchInitialMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMore || !nextCursor || isLoading) return;
    setIsLoading(true);
    try {
      const res = await conversationsApi.getMessages(conversationId, nextCursor);
      setMessages((prev) => [...res.messages, ...prev]);
      setNextCursor(res.next_cursor);
      setHasMore(res.has_more);
    } catch (e) {
      console.error('Failed to load older messages:', e);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, hasMore, nextCursor, isLoading]);

  // Subscribe to real-time events for active conversation
  useEffect(() => {
    if (!conversationId) return;

    const handleWSEvent = (event: WSEvent) => {
      if (event.event === 'NEW_MESSAGE') {
        const newMsg: Message = event.data;
        if (newMsg.conversation_id === conversationId) {
          setMessages((prev) => {
            // Avoid duplicate message appending
            if (prev.some((m) => m.id === newMsg.id || (newMsg.temp_id && m.temp_id === newMsg.temp_id))) {
              return prev.map((m) => (m.temp_id === newMsg.temp_id ? newMsg : m));
            }
            return [...prev, newMsg];
          });
        }
      } else if (event.event === 'USER_TYPING') {
        const payload: TypingPayload = event.data;
        if (payload.conversation_id === conversationId) {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            if (payload.is_typing) {
              next.set(payload.user_id, payload.display_name || payload.username);
            } else {
              next.delete(payload.user_id);
            }
            return next;
          });
        }
      } else if (event.event === 'RECEIPT_UPDATE') {
        const payload: ReceiptUpdatePayload = event.data;
        if (payload.conversation_id === conversationId) {
          setMessages((prev) =>
            prev.map((m) => {
              if (payload.message_id && m.id !== payload.message_id) return m;
              const hasReceipt = (m.receipts || []).some((r) => r.user_id === payload.user_id);
              const updatedReceipts = hasReceipt
                ? m.receipts.map((r) => (r.user_id === payload.user_id ? { ...r, status: payload.status } : r))
                : [...(m.receipts || []), { user_id: payload.user_id, status: payload.status }];
              return { ...m, receipts: updatedReceipts };
            })
          );
        }
      }
    };

    const unsubscribe = socketClient.subscribe(handleWSEvent);
    return () => unsubscribe();
  }, [conversationId]);

  const sendMessage = useCallback((content: string) => {
    if (!conversationId || !content.trim()) return;
    const tempId = `temp_${Date.now()}`;
    socketClient.send('SEND_MESSAGE', {
      conversation_id: conversationId,
      content: content.trim(),
      temp_id: tempId,
    });
  }, [conversationId]);

  const sendTypingStart = useCallback(() => {
    if (!conversationId) return;
    socketClient.send('TYPING_START', { conversation_id: conversationId });
  }, [conversationId]);

  const sendTypingStop = useCallback(() => {
    if (!conversationId) return;
    socketClient.send('TYPING_STOP', { conversation_id: conversationId });
  }, [conversationId]);

  return {
    messages,
    isLoading,
    hasMore,
    loadMoreMessages,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    typingUsers: Array.from(typingUsers.values()),
  };
}
