import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Message } from '../../types/message';
import { User } from '../../types/user';

interface MessageItemProps {
  message: Message;
  currentUser: User | null;
  showSenderName?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUser,
  showSenderName = false,
}) => {
  const isSelf = message.sender_id === currentUser?.id;

  if (message.message_type === 'SYSTEM') {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 bg-gray-200 dark:bg-signal-dark-surface text-gray-600 dark:text-gray-400 text-[11px] font-medium rounded-full shadow-sm">
          {message.content}
        </span>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Determine highest receipt status
  const getReceiptStatus = () => {
    if (!message.receipts || message.receipts.length === 0) return 'SENT';
    const isAnyRead = message.receipts.some((r) => r.status === 'READ');
    if (isAnyRead) return 'READ';
    const isAnyDelivered = message.receipts.some((r) => r.status === 'DELIVERED');
    if (isAnyDelivered) return 'DELIVERED';
    return 'SENT';
  };

  const receiptStatus = getReceiptStatus();

  return (
    <div className={`flex flex-col my-1 ${isSelf ? 'items-end' : 'items-start'}`}>
      {/* Sender Name in Group Chat */}
      {showSenderName && !isSelf && message.sender && (
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 ml-1">
          {message.sender.display_name}
        </span>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl relative shadow-sm text-sm break-words ${
          isSelf
            ? 'bg-signal-blue text-white rounded-br-none'
            : 'bg-gray-100 dark:bg-signal-dark-bubble text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-signal-dark-border/40'
        }`}
      >
        <p className="leading-relaxed">{message.content}</p>

        {/* Footer: Timestamp + Receipt Icon */}
        <div className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
          isSelf ? 'text-blue-100' : 'text-gray-400'
        }`}>
          <span>{formatTime(message.created_at)}</span>

          {isSelf && (
            <span className="ml-1">
              {receiptStatus === 'READ' ? (
                <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-sky-200 fill-sky-200" /></span>
              ) : receiptStatus === 'DELIVERED' ? (
                <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-blue-200" /></span>
              ) : (
                <span title="Sent"><Check className="w-3.5 h-3.5 text-blue-200" /></span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
