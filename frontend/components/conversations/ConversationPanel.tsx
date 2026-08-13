import React, { useState } from 'react';
import { Search, Plus, Users, MessageSquarePlus } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { Conversation } from '../../types/conversation';
import { User } from '../../types/user';

interface ConversationPanelProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  currentUser: User | null;
  onSelectConversation: (conv: Conversation) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  activeConversation,
  currentUser,
  onSelectConversation,
  onOpenNewChat,
  onOpenNewGroup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredConversations = conversations.filter((conv) => {
    // Filter unread
    if (filter === 'unread' && (!conv.unread_count || conv.unread_count === 0)) {
      return false;
    }

    // Filter search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (conv.name && conv.name.toLowerCase().includes(q)) return true;
    if (conv.members) {
      return conv.members.some(
        (m) =>
          m.user.display_name.toLowerCase().includes(q) ||
          m.user.username.toLowerCase().includes(q)
      );
    }
    return false;
  });

  return (
    <div className="w-80 h-screen flex flex-col bg-white dark:bg-signal-dark-panel border-r border-gray-200 dark:border-signal-dark-border flex-shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-100 dark:border-signal-dark-border/50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Chats</h1>
          <div className="flex items-center space-x-1">
            <button
              onClick={onOpenNewChat}
              title="New Direct Message"
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-signal-dark-surface transition-colors"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenNewGroup}
              title="New Group"
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-signal-dark-surface transition-colors"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compact Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 mt-3 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUser={currentUser}
              isActive={activeConversation?.id === conv.id}
              onSelect={onSelectConversation}
            />
          ))
        ) : (
          <div className="py-12 px-4 text-center">
            <p className="text-xs text-gray-400 font-medium">No conversations found</p>
            <p className="text-[11px] text-gray-400 mt-1">Start a new chat using the icon above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
