import React from 'react';
import { PhoneCall, Video, ShieldCheck } from 'lucide-react';

export const CallsPlaceholder: React.FC = () => {
  return (
    <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-signal-dark p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-signal-dark-surface border border-blue-100 dark:border-signal-dark-border flex items-center justify-center mb-6 shadow-sm">
        <PhoneCall className="w-10 h-10 text-signal-blue" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Signal Calls</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-6">
        End-to-end encrypted voice and video calls. Connect with your contacts securely across mobile and desktop.
      </p>
      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-950/60 text-signal-blue text-xs font-semibold rounded-full">
        <ShieldCheck className="w-4 h-4" />
        <span>UI Placeholder Section (Assignment Scope)</span>
      </div>
    </div>
  );
};
