import React, { useState, useEffect } from 'react';
import { Users, X, Check, Loader2 } from 'lucide-react';
import { contactsApi, ContactResponse } from '../../services/api/contacts';
import { conversationsApi } from '../../services/api/conversations';
import { Conversation } from '../../types/conversation';
import { Avatar } from '../common/Avatar';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called with the newly created group conversation.
   * The parent is responsible for calling upsertConversation, setActive, and closing the modal.
   */
  onConversationReady: (conv: Conversation) => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  onConversationReady,
}) => {
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      contactsApi.getContacts()
        .then((res) => setContacts(res))
        .catch((e) => console.error(e))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await conversationsApi.createGroup(groupName.trim(), selectedIds);
      // Fetch the full conversation data for the newly created group
      const allConvs = await conversationsApi.getConversations();
      const created = allConvs.find((c) => c.id === res.conversation_id);
      if (created) {
        onConversationReady(created);
      }
    } catch (e) {
      console.error('Failed to create group:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-signal-dark-panel rounded-2xl shadow-2xl border border-gray-200 dark:border-signal-dark-border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-signal-dark-border">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-signal-blue" />
            Create New Group
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Signal Core Engineering"
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-signal-dark-surface border border-transparent focus:border-signal-blue rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Select Members ({selectedIds.length})
            </label>
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {isLoading ? (
                <div className="py-6 flex justify-center text-signal-blue">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : contacts.length > 0 ? (
                contacts.map((c) => {
                  const isSelected = selectedIds.includes(c.contact_user.id);
                  return (
                    <div
                      key={c.contact_user.id}
                      onClick={() => toggleSelect(c.contact_user.id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-signal-dark-surface border border-signal-blue/30'
                          : 'hover:bg-gray-100 dark:hover:bg-signal-dark-surface'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar name={c.contact_user.display_name} url={c.contact_user.avatar_url} size="md" isOnline={c.contact_user.is_online} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{c.contact_user.display_name}</p>
                          <p className="text-xs text-gray-400">@{c.contact_user.username}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected ? 'bg-signal-blue border-signal-blue text-white' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-6 text-xs text-gray-400">No contacts available to add.</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-signal-dark-surface rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !groupName.trim() || selectedIds.length === 0}
              className="px-5 py-2 bg-signal-blue hover:bg-signal-blue-hover text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
