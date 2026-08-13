import React from 'react';
import { Avatar } from '../common/Avatar';
import { Conversation } from '../../types/conversation';
import { User } from '../../types/user';

interface ConversationItemProps {
  conversation: Conversation;
  currentUser: User | null;
  isActive: boolean;
  onSelect: (conv: Conversation) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUser,
  isActive,
  onSelect,
}) => {
  const isGroup = conversation.type === 'GROUP';
  let title = conversation.name || 'Conversation';
  let avatarUrl = conversation.avatar_url;
  let isOnline = false;

  if (!isGroup && conversation.members) {
    const peer = conversation.members.find((m) => m.user_id !== currentUser?.id)?.user;
    if (peer) {
      title = peer.display_name;
      avatarUrl = peer.avatar_url;
      isOnline = !!peer.is_online;
    }
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getLastMessagePreview = () => {
    if (!conversation.last_message) return 'No messages yet';
    const msg = conversation.last_message;
    if (msg.message_type === 'SYSTEM') return msg.content;
    const prefix = isGroup && msg.sender ? `${msg.sender.display_name.split(' ')[0]}: ` : '';
    return `${prefix}${msg.content}`;
  };

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-signal-dark-border/40 ${
        isActive
          ? 'bg-blue-50 dark:bg-signal-dark-surface'
          : 'hover:bg-gray-50 dark:hover:bg-signal-dark-surface/50'
      }`}
    >
      <Avatar name={title} url={avatarUrl} isGroup={isGroup} isOnline={isOnline} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-signal-blue' : 'text-gray-900 dark:text-gray-100'}`}>
            {title}
          </h3>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal flex-shrink-0">
            {formatTime(conversation.last_activity_at)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
            {getLastMessagePreview()}
          </p>
          {conversation.unread_count > 0 && (
            <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-signal-blue text-white text-[10px] font-bold shadow-sm">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
