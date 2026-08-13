import React, { useState } from 'react';
import { Search, X, UserPlus, Loader2 } from 'lucide-react';
import { usersApi } from '../../services/api/users';
import { conversationsApi } from '../../services/api/conversations';
import { User } from '../../types/user';
import { Conversation } from '../../types/conversation';
import { Avatar } from '../common/Avatar';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conv: Conversation) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await usersApi.search(query);
      setResults(res);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = async (targetUser: User) => {
    setIsCreating(true);
    try {
      const conv = await conversationsApi.createDirect(targetUser.id);
      onSelectConversation(conv);
      onClose();
    } catch (e) {
      console.error('Error starting conversation:', e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-signal-dark-panel rounded-2xl shadow-2xl border border-gray-200 dark:border-signal-dark-border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-signal-dark-border">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-signal-blue" />
            New Direct Message
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or phone (+1...)"
              className="w-full pl-10 pr-24 py-2.5 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-2 px-3 py-1 bg-signal-blue hover:bg-signal-blue-hover text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Results List */}
          <div className="mt-4 max-h-64 overflow-y-auto space-y-1 pr-1">
            {results.length > 0 ? (
              results.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-signal-dark-surface cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar name={u.display_name} url={u.avatar_url} size="md" isOnline={u.is_online} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{u.display_name}</p>
                      <p className="text-xs text-gray-400">@{u.username} {u.phone ? `• ${u.phone}` : ''}</p>
                    </div>
                  </div>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-signal-blue" />
                  ) : (
                    <span className="text-xs font-medium text-signal-blue">Chat</span>
                  )}
                </div>
              ))
            ) : query && !isSearching ? (
              <p className="text-center py-6 text-xs text-gray-400">No users found matching "{query}"</p>
            ) : (
              <p className="text-center py-6 text-xs text-gray-400">Type a username or phone number to search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
