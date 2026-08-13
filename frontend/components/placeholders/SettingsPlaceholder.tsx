import React from 'react';
import { User as UserIcon, Shield, Smartphone, Bell, Eye, Palette, HardDrive, Key } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { User } from '../../types/user';
import { Avatar } from '../common/Avatar';

interface SettingsPlaceholderProps {
  user: User | null;
}

export const SettingsPlaceholder: React.FC<SettingsPlaceholderProps> = ({ user }) => {
  const sections = [
    { icon: Shield, label: 'Privacy & Safety', sub: 'Blocklist, read receipts, sealed sender' },
    { icon: Smartphone, label: 'Linked Devices', sub: 'Manage iPad, Desktop, and Web sessions' },
    { icon: Bell, label: 'Notifications', sub: 'Message sounds, badges, and popups' },
    { icon: Eye, label: 'Appearance', sub: 'Theme, wallpaper, and font size' },
    { icon: HardDrive, label: 'Storage', sub: 'Media auto-download and storage usage' },
  ];

  return (
    <div className="flex-1 h-screen flex flex-col bg-white dark:bg-signal-dark overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 dark:border-signal-dark-border">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      </div>

      <div className="max-w-2xl px-8 py-6 space-y-6">
        {/* Profile Card */}
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 dark:bg-signal-dark-panel border border-gray-200 dark:border-signal-dark-border">
          <Avatar name={user?.display_name || 'User'} url={user?.avatar_url} size="xl" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{user?.display_name}</h2>
            <p className="text-xs text-gray-400">@{user?.username} {user?.phone ? `• ${user?.phone}` : ''}</p>
          </div>
        </div>

        {/* Theme Setting */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-signal-dark-panel border border-gray-200 dark:border-signal-dark-border">
          <div className="flex items-center space-x-3">
            <Palette className="w-5 h-5 text-signal-blue" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Theme Preference</p>
              <p className="text-xs text-gray-400">Toggle light or dark Signal interface</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Settings Sections List */}
        <div className="space-y-2">
          {sections.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50 dark:bg-signal-dark-panel border border-gray-200 dark:border-signal-dark-border hover:bg-gray-100 dark:hover:bg-signal-dark-surface transition-colors cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-signal-dark-surface text-signal-blue">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.label}</h3>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
