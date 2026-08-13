import React from 'react';
import { MessageSquare, Phone, CircleDashed, Settings, LogOut } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { ThemeToggle } from '../common/ThemeToggle';
import { User } from '../../types/user';

export type RailTab = 'chats' | 'calls' | 'stories' | 'settings';

interface SideRailProps {
  activeTab: RailTab;
  onTabChange: (tab: RailTab) => void;
  user: User | null;
  onLogout: () => void;
}

export const SideRail: React.FC<SideRailProps> = ({
  activeTab,
  onTabChange,
  user,
  onLogout,
}) => {
  const items = [
    { id: 'chats' as RailTab, label: 'Chats', icon: MessageSquare },
    { id: 'calls' as RailTab, label: 'Calls', icon: Phone },
    { id: 'stories' as RailTab, label: 'Stories', icon: CircleDashed },
    { id: 'settings' as RailTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-16 h-screen flex flex-col items-center justify-between py-4 bg-gray-100 dark:bg-signal-dark border-r border-gray-200 dark:border-signal-dark-border flex-shrink-0 z-20">
      {/* Top Section */}
      <div className="flex flex-col items-center space-y-6 w-full">
        {/* User Profile Avatar */}
        <div className="pt-2 cursor-pointer" title={user?.display_name || user?.username}>
          <Avatar name={user?.display_name || 'User'} url={user?.avatar_url} size="md" isOnline={true} />
        </div>

        {/* Navigation Buttons */}
        <nav className="flex flex-col items-center space-y-2 w-full px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                title={item.label}
                className={`p-3 rounded-xl transition-all duration-150 relative ${
                  isActive
                    ? 'bg-signal-blue text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-signal-dark-surface hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center space-y-3 w-full pb-2">
        <ThemeToggle />

        <button
          onClick={onLogout}
          title="Log Out"
          className="p-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
