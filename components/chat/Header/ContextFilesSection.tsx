// ContextFilesSection.tsx
import { Upload } from "lucide-react";
import { ContextFileItem } from "./ContextFileItem";
import { ContextFilesSectionProps } from "../types";

export default function ContextFilesSection({
  chatError,
  chatContexts,
  handleChatFileChange,
  handleRemoveChatContext,
}: ContextFilesSectionProps) {
  return (
    <section className="px-6 py-4 border-b bg-white">
      <h2 className="font-semibold">📁 Chat Context Files</h2>
      <label
        htmlFor="chat-file-upload"
        className="inline-flex items-center gap-1 mt-2 mb-4 cursor-pointer bg-green-600 text-white px-3 py-1 rounded"
      >
        <Upload className="w-4 h-4" />
        Upload Context
        <input
          id="chat-file-upload"
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleChatFileChange}
          className="hidden"
        />
      </label>

      {chatError && (
        <p className="text-red-500">Failed to load chat contexts.</p>
      )}
      {!chatContexts ? (
        <p className="text-gray-600">Loading chat contexts…</p>
      ) : chatContexts.length === 0 ? (
        <p className="text-gray-400 italic">No chat-level context files.</p>
      ) : (
        <div className="space-y-2">
          {chatContexts.map((ctx) => (
            <ContextFileItem
              key={ctx.id}
              ctx={ctx}
              onRemove={handleRemoveChatContext}
            />
          ))}
        </div>
      )}
    </section>
  );
}
