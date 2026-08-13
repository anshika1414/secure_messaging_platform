import React from 'react';
import { Header } from '../layout/Header';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Conversation } from '../../types/conversation';
import { User } from '../../types/user';
import { useMessages } from '../../hooks/useMessages';
import { Shield, Lock } from 'lucide-react';

interface ChatPaneProps {
  conversation: Conversation | null;
  currentUser: User | null;
  onOpenGroupDetails?: () => void;
  onOpenContactDetails?: () => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  conversation,
  currentUser,
  onOpenGroupDetails,
  onOpenContactDetails,
}) => {
  const {
    messages,
    isLoading,
    hasMore,
    loadMoreMessages,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    typingUsers,
  } = useMessages(conversation?.id);

  if (!conversation) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-signal-dark text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-signal-dark-surface border border-blue-100 dark:border-signal-dark-border flex items-center justify-center mb-6 shadow-sm">
          <Shield className="w-10 h-10 text-signal-blue" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Signal Desktop</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
          Select a conversation from the sidebar or start a new direct message to begin secure messaging.
        </p>
        <div className="mt-8 flex items-center space-x-2 text-xs text-gray-400">
          <Lock className="w-3.5 h-3.5" />
          <span>Signal clone full-stack assignment platform</span>
        </div>
      </div>
    );
  }

  const isGroup = conversation.type === 'GROUP';

  return (
    <main className="flex-1 h-screen flex flex-col bg-white dark:bg-signal-dark overflow-hidden">
      <Header
        conversation={conversation}
        currentUser={currentUser}
        onOpenGroupDetails={onOpenGroupDetails}
        onOpenContactDetails={onOpenContactDetails}
      />

      <MessageList
        messages={messages}
        currentUser={currentUser}
        isGroup={isGroup}
        hasMore={hasMore}
        isLoadingMore={isLoading}
        onLoadMore={loadMoreMessages}
        typingUsers={typingUsers}
      />

      <MessageInput
        onSendMessage={sendMessage}
        onTypingStart={sendTypingStart}
        onTypingStop={sendTypingStop}
      />
    </main>
  );
};
