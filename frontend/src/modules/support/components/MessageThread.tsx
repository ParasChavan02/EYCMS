import React from 'react';
import { TicketMessage, TicketAttachment } from '../types';
import { formatDate, formatFileSize } from '../utils/ticketUtils';
import { FileText, Download } from 'lucide-react';

interface MessageItemProps {
  message: TicketMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return (
    <div className="mb-4 flex gap-3">
      <div className="flex-shrink-0">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
            message.isAdminReply ? 'bg-blue-600' : 'bg-gray-400'
          }`}
        >
          {message.sender.name.charAt(0)}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900">{message.sender.name}</span>
          {message.isAdminReply && (
            <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              Admin
            </span>
          )}
          <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap mb-3">{message.message}</p>
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <AttachmentItem key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface AttachmentItemProps {
  attachment: TicketAttachment;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({ attachment }) => {
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
    >
      <FileText className="h-4 w-4 text-gray-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {attachment.fileName}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>
      <Download className="h-4 w-4 text-gray-400" />
    </a>
  );
};

interface MessageThreadProps {
  messages: TicketMessage[];
  isLoading?: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="mb-2 h-4 w-32 rounded bg-gray-200"></div>
            <div className="mb-2 h-16 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 py-8 text-center">
        <p className="text-gray-500">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
};

interface ReplyFormProps {
  onSubmit: (message: string, attachments?: TicketAttachment[]) => Promise<void>;
  isLoading?: boolean;
}

export const ReplyForm: React.FC<ReplyFormProps> = ({ onSubmit, isLoading = false }) => {
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(message);
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Reply
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your response here..."
          rows={6}
          disabled={isLoading || isSubmitting}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || isSubmitting || !message.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {isSubmitting ? 'Sending...' : 'Send Reply'}
        </button>
      </div>
    </form>
  );
};

