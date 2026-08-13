import React from 'react';

interface AvatarProps {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  isGroup?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  url,
  size = 'md',
  isOnline = false,
  isGroup = false,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  const badgeSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  }[size];

  const getInitial = () => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      {url ? (
        <img
          src={url}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover border border-gray-200 dark:border-signal-dark-border`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
            isGroup
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-500'
              : 'bg-gradient-to-tr from-blue-600 to-signal-blue'
          }`}
        >
          {getInitial()}
        </div>
      )}
      {isOnline && !isGroup && (
        <span
          className={`absolute bottom-0 right-0 ${badgeSize} rounded-full bg-green-500 ring-2 ring-white dark:ring-signal-dark-panel`}
        />
      )}
    </div>
  );
};
