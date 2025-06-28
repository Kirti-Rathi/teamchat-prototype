"use client";
import React, { RefObject } from "react";
import { Message } from "@/types/message";
import MessageItem from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  currentUserInitials: string;
  loading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserInitials,
  loading,
  messagesEndRef,
}) => {
  if (loading) {
    return (
      <div className="text-gray-400 text-center animate-pulse">
        Loading messages...
      </div>
    );
  }

  if (messages.length === 0) {
    return <div className="text-gray-400 text-center">No messages yet.</div>;
  }

  return (
    <>
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          currentUserInitials={currentUserInitials}
        />
      ))}
      <div ref={messagesEndRef} />
    </>
  );
};

export default MessageList;
