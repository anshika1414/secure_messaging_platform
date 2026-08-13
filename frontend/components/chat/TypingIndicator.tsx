import React from 'react';

interface TypingIndicatorProps {
  users: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) return null;

  const namesText = users.length === 1 ? users[0] : `${users[0]} and ${users.length - 1} others`;

  return (
    <div className="flex items-center space-x-2 py-1 px-4 animate-fade-in">
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-signal-dark-bubble px-3 py-1.5 rounded-full border border-gray-200 dark:border-signal-dark-border/40">
        <span className="w-1.5 h-1.5 bg-signal-blue rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-signal-blue rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-signal-blue rounded-full animate-bounce" />
      </div>
      <span className="text-xs text-gray-400 font-normal italic">
        {namesText} is typing...
      </span>
    </div>
  );
};
