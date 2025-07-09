// // MessageItem.tsx (Individual message component)
// import clsx from "clsx";
// import MessageContent from "./MessageContent";
// import UserAvatar from "./UserAvatar";
// import { getInitials } from "@/lib/utils/getInitials";
// import MessageTimestamp from "./MessageTimestamp";
// import { MessageItemProps } from "../types";

// export default function MessageItem({ message, user }: MessageItemProps) {
//   const isAI = message.sender_type === "ai";
//   const userInitials = getInitials(user?.firstName || user?.username || "User");

//   return (
//     <div className={clsx("flex group", isAI ? "justify-start" : "justify-end")}>
//       {isAI && (
//         <UserAvatar
//           label="AI"
//           bgColor="bg-blue-200"
//           textColor="text-blue-900"
//           position="mr-2"
//         />
//       )}

//       <div
//         className={clsx(
//           "w-fit max-w-xl px-4 py-2 rounded-lg shadow-sm text-sm relative break-words overflow-wrap",
//           isAI
//             ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 self-start"
//             : "bg-white text-gray-900 self-end border"
//         )}
//       >
//         <div className="flex items-center gap-2 mb-1">
//           <span className="font-semibold">
//             {isAI ? "Gemini AI" : userInitials}
//           </span>
//           <MessageTimestamp timestamp={message.created_at} />
//         </div>
//         <MessageContent isAI={isAI} content={message.content} />
//       </div>

//       {!isAI && (
//         <UserAvatar
//           label={userInitials}
//           bgColor="bg-gray-200"
//           textColor="text-gray-900"
//           position="ml-2"
//         />
//       )}
//     </div>
//   );
// }

// MessageItem.tsx
import clsx from "clsx";
import MessageContent from "./MessageContent";
import UserAvatar from "./UserAvatar";
import { getInitials } from "@/lib/utils/getInitials";
import MessageTimestamp from "./MessageTimestamp";
import { MessageItemProps } from "../types";
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  PencilLine,
  Share,
} from "lucide-react";

export default function MessageItem({ message, user }: MessageItemProps) {
  const isAI = message.sender_type === "ai";
  const userInitials = getInitials(user?.firstName || user?.username || "User");

  // Handle copy action
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    // Optionally show a toast or notification
  };

  return (
    <div className={clsx("flex group", isAI ? "justify-start" : "justify-end")}>
      {/* Avatar on left for AI */}
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
          "w-fit max-w-xl px-4 py-2 rounded-lg shadow-sm text-sm break-words overflow-wrap",
          isAI
            ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 self-start"
            : "bg-white text-gray-900 self-end border"
        )}
      >
        {/* Header: Name + Timestamp */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">
            {isAI ? "Gemini AI" : userInitials}
          </span>
          <MessageTimestamp timestamp={message.created_at} />
        </div>

        {/* Actual message */}
        <MessageContent isAI={isAI} content={message.content} />

        {/* Bottom action bar (only for AI) */}
        {isAI && (
          <div className="mt-2 flex justify-start space-x-2 transition-opacity duration-200">
            <button
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button aria-label="Like" className="p-1 hover:bg-gray-200 rounded">
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              aria-label="Dislike"
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
            <button
              aria-label="Regenerate"
              className="p-1 hover:bg-gray-200 rounded"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              aria-label="Edit in canvas"
              className="p-1 hover:bg-gray-200 rounded"
            >
              <PencilLine className="w-4 h-4" />
            </button>
            <button
              aria-label="Share"
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Share className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Avatar on right for user */}
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
