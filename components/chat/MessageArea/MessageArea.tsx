// MessageArea.tsx (Main container)

import MessageItem from "./MessageItem";
import LoadingMessages from "./LoadingMessages";
import EmptyMessages from "./EmptyMessages";
import { MessageAreaProps } from "../types";

export default function MessageArea({
  loading,
  messages,
  user,
  messagesEndRef,
}: MessageAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 bg-gray-50">
      {loading ? (
        <LoadingMessages />
      ) : messages.length === 0 ? (
        <EmptyMessages />
      ) : (
        <>
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} user={user} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
