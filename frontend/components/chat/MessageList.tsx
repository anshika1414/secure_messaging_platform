import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '../../types/message';
import { User } from '../../types/user';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  isGroup: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  typingUsers: string[];
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  isGroup,
  hasMore,
  isLoadingMore,
  onLoadMore,
  typingUsers,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers.length]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    if (scrollRef.current.scrollTop === 0 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-1 bg-white dark:bg-signal-dark flex flex-col justify-end"
    >
      {/* Load More Button / Indicator */}
      {hasMore && (
        <div className="flex justify-center py-2">
          {isLoadingMore ? (
            <Loader2 className="w-5 h-5 animate-spin text-signal-blue" />
          ) : (
            <button
              onClick={onLoadMore}
              className="text-xs font-semibold text-signal-blue hover:underline py-1 px-3 rounded-full bg-blue-50 dark:bg-signal-dark-surface"
            >
              Load previous messages
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, idx) => {
        const prevMsg = messages[idx - 1];
        const showSenderName = isGroup && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
        return (
          <MessageItem
            key={msg.id || msg.temp_id || idx}
            message={msg}
            currentUser={currentUser}
            showSenderName={showSenderName}
          />
        );
      })}

      {/* Typing Indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};
