import React, { useState } from 'react';
import { X, Users, UserPlus, Shield, Trash2, Loader2 } from 'lucide-react';
import { Conversation } from '../../types/conversation';
import { User } from '../../types/user';
import { conversationsApi } from '../../services/api/conversations';
import { contactsApi, ContactResponse } from '../../services/api/contacts';
import { Avatar } from '../common/Avatar';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  currentUser: User | null;
  onRefreshConversation: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser,
  onRefreshConversation,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !conversation) return null;

  const currentMember = conversation.members?.find((m) => m.user_id === currentUser?.id);
  const isAdmin = currentMember?.role === 'ADMIN';

  const openAddMember = async () => {
    setIsAdding(true);
    try {
      const res = await contactsApi.getContacts();
      // Filter out users already in group
      const existingIds = new Set(conversation.members?.map((m) => m.user_id) || []);
      setContacts(res.filter((c) => !existingIds.has(c.contact_user.id)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMemberSubmit = async () => {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    try {
      const groupId = conversation.id; // groupId / convId
      await conversationsApi.addGroupMember(groupId, selectedUserId);
      onRefreshConversation();
      setIsAdding(false);
    } catch (e) {
      console.error('Failed to add member:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    setIsSubmitting(true);
    try {
      await conversationsApi.removeGroupMember(conversation.id, targetUserId);
      onRefreshConversation();
    } catch (e) {
      console.error('Failed to remove member:', e);
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
            Group Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Group Header Info */}
          <div className="flex items-center space-x-4">
            <Avatar name={conversation.name || 'Group'} url={conversation.avatar_url} isGroup={true} size="xl" />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{conversation.name}</h3>
              <p className="text-xs text-gray-400">{conversation.members?.length || 0} members</p>
            </div>
          </div>

          {/* Members List Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Group Members
            </h4>
            {isAdmin && !isAdding && (
              <button
                onClick={openAddMember}
                className="text-xs font-semibold text-signal-blue hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Member
              </button>
            )}
          </div>

          {/* Add Member Subform */}
          {isAdding && (
            <div className="p-4 bg-gray-50 dark:bg-signal-dark-surface rounded-xl space-y-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Select Contact to Add:
              </label>
              {contacts.length > 0 ? (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-signal-dark-panel border border-gray-200 dark:border-signal-dark-border rounded-lg text-xs"
                >
                  <option value="">-- Choose Contact --</option>
                  {contacts.map((c) => (
                    <option key={c.contact_user.id} value={c.contact_user.id}>
                      {c.contact_user.display_name} (@{c.contact_user.username})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-gray-400">No new contacts to add.</p>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMemberSubmit}
                  disabled={!selectedUserId || isSubmitting}
                  className="px-3 py-1 bg-signal-blue text-white text-xs font-medium rounded-lg disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {conversation.members?.map((m) => {
              const isMemberAdmin = m.role === 'ADMIN';
              const isMe = m.user_id === currentUser?.id;
              return (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-signal-dark-surface transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar name={m.user.display_name} url={m.user.avatar_url} size="md" isOnline={m.user.is_online} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        {m.user.display_name} {isMe && <span className="text-gray-400 text-xs">(You)</span>}
                      </p>
                      <p className="text-xs text-gray-400">@{m.user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isMemberAdmin && (
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-signal-blue text-[10px] font-bold flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                    {isAdmin && !isMe && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        disabled={isSubmitting}
                        title="Remove member"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
