import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
}) => {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<any>(null);
  const isTypingRef = useRef(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingStart();
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingStop();
    }, 2000);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    onSendMessage(content.trim());
    setContent('');

    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-signal-dark-panel border-t border-gray-200 dark:border-signal-dark-border z-10">
      <form onSubmit={handleSend} className="flex items-center space-x-3">
        {/* Attachment icon */}
        <button
          type="button"
          title="Attach file (Signal placeholder)"
          className="p-2.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-signal-dark-surface transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input box */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Signal message"
            className="w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
          />
          <button
            type="button"
            title="Emoji"
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!content.trim()}
          title="Send message"
          className="p-3 bg-signal-blue hover:bg-signal-blue-hover text-white rounded-full disabled:opacity-40 transition-all shadow-md flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
