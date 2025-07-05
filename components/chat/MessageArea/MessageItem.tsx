// MessageItem.tsx (Individual message component)
import clsx from "clsx";
import MessageContent from "./MessageContent";
import UserAvatar from "./UserAvatar";
import { getInitials } from "@/lib/utils/getInitials";
import MessageTimestamp from "./MessageTimestamp";
import { MessageItemProps } from "../types";

export default function MessageItem({ message, user }: MessageItemProps) {
  const isAI = message.sender_type === "ai";
  const userInitials = getInitials(user?.firstName || user?.username || "User");

  return (
    <div className={clsx("flex group", isAI ? "justify-start" : "justify-end")}>
      {isAI && (
        <UserAvatar
          label="AI"
          bgColor="bg-blue-200"
          textColor="text-blue-900"
          position="mr-2"
        />
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
            {isAI ? "Gemini AI" : userInitials}
          </span>
          <MessageTimestamp timestamp={message.created_at} />
        </div>
        <MessageContent isAI={isAI} content={message.content} />
      </div>

      {!isAI && (
        <UserAvatar
          label={userInitials}
          bgColor="bg-gray-200"
          textColor="text-gray-900"
          position="ml-2"
        />
      )}
    </div>
  );
}
