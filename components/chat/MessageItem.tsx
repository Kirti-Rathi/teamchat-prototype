"use client";
import React from "react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { Message } from "@/types/message";

interface MessageItemProps {
  message: Message;
  currentUserInitials: string;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserInitials,
}) => {
  const isAI = message.sender_type === "ai";

  return (
    <div
      key={message.id}
      className={clsx("flex group", isAI ? "justify-start" : "justify-end")}
    >
      {isAI && (
        <div className="flex flex-col items-center mr-2">
          <div className="w-8 h-8 bg-blue-200 text-blue-900 rounded-full flex items-center justify-center font-bold">
            AI
          </div>
        </div>
      )}

      <div
        className={clsx(
          "w-fit max-w-xl px-4 py-2 rounded-lg shadow-sm text-sm relative break-words overflow-wrap",
          isAI
            ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 self-start"
            : "bg-white text-gray-900 self-end border"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">
            {isAI ? "Gemini AI" : currentUserInitials}
          </span>
          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {isAI ? (
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                return (
                  <code
                    className={clsx(
                      className,
                      "bg-gray-200 rounded px-1 py-0.5 text-xs font-mono break-words"
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre({ className, children, ...props }) {
                return (
                  <pre
                    className="bg-gray-200 rounded p-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto"
                    {...props}
                  >
                    {children}
                  </pre>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          message.content
        )}
      </div>

      {!isAI && (
        <div className="flex flex-col items-center ml-2">
          <div className="w-8 h-8 bg-gray-200 text-gray-900 rounded-full flex items-center justify-center font-bold">
            {currentUserInitials}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
