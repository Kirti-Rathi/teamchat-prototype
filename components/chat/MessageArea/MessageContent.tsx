// MessageContent.tsx (Handles content rendering)
import ReactMarkdown from "react-markdown";
import clsx from "clsx";
import { MessageContentProps } from "../types";

export default function MessageContent({ isAI, content }: MessageContentProps) {
  if (!isAI) {
    return <>{content}</>;
  }

  return (
    <div className="break-words overflow-wrap">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
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
          pre({ node, className, children, ...props }) {
            return (
              <pre
                className="bg-gray-200 rounded p-2 text-xs font-mono break-words whitespace-pre-wrap overflow-x-auto"
                {...props}
              >
                {children}
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
