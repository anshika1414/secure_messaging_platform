import React from 'react';
import { Phone, Video, Users, MoreVertical } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Conversation } from '../../types/conversation';
import { User } from '../../types/user';

interface HeaderProps {
  conversation: Conversation | null;
  currentUser: User | null;
  onOpenGroupDetails?: () => void;
  onOpenContactDetails?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  conversation,
  currentUser,
  onOpenGroupDetails,
  onOpenContactDetails,
}) => {
  if (!conversation) return null;

  const isGroup = conversation.type === 'GROUP';
  let title = conversation.name || 'Chat';
  let avatarUrl = conversation.avatar_url;
  let subtitle = isGroup ? `${conversation.members?.length || 0} members` : 'Offline';

  if (!isGroup && conversation.members) {
    const peer = conversation.members.find((m) => m.user_id !== currentUser?.id)?.user;
    if (peer) {
      title = peer.display_name;
      avatarUrl = peer.avatar_url;
      subtitle = peer.is_online ? 'Online' : 'Offline';
    }
  }

  const handleHeaderClick = () => {
    if (isGroup) {
      if (onOpenGroupDetails) onOpenGroupDetails();
    } else {
      if (onOpenContactDetails) onOpenContactDetails();
    }
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between bg-white dark:bg-signal-dark-panel border-b border-gray-200 dark:border-signal-dark-border z-10">
      <div className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity" onClick={handleHeaderClick}>
        <Avatar name={title} url={avatarUrl} isGroup={isGroup} isOnline={subtitle === 'Online'} size="md" />
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight flex items-center gap-1.5">
            {title}
            {isGroup && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-signal-blue font-medium">Group</span>}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">{subtitle}</p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
        <button
          title="Voice Call (Coming Soon)"
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-signal-dark-surface transition-colors"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          title="Video Call (Coming Soon)"
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-signal-dark-surface transition-colors"
        >
          <Video className="w-4 h-4" />
        </button>

        {isGroup && (
          <button
            onClick={onOpenGroupDetails}
            title="Group Information"
            className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-signal-dark-surface transition-colors text-signal-blue"
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        <button
          title="More Options"
          className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-signal-dark-surface transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
