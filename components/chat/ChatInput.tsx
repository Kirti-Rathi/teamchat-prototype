"use client";
import React from "react";
import clsx from "clsx";
import { Send, Pause, FileDown } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: (e: React.FormEvent) => void;
  canSend: boolean;
  loading: boolean;
  aiLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSend,
  canSend,
  loading,
  aiLoading,
}) => {
  return (
    <form
      onSubmit={handleSend}
      className="sticky bottom-0 z-10 bg-white border-t flex gap-2 px-6 py-4"
      autoComplete="off"
    >
      <textarea
        className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring resize-none min-h-[40px] max-h-32"
        placeholder={
          canSend ? "Type a message..." : "You have read-only access"
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={!canSend || loading || aiLoading}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
          }
        }}
      />
      <button
        type="submit"
        className={clsx(
          "flex items-center gap-1 px-4 py-2 rounded font-semibold transition",
          canSend && input.trim() && !aiLoading && !loading
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        )}
        disabled={!canSend || !input.trim()}
        title={aiLoading || loading ? "Pause" : "Send"}
      >
        {aiLoading || loading ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Send className="w-5 h-5" />
        )}
        <span className="sr-only">Send</span>
      </button>

      <div className="ml-2 relative">
        <button className="p-2 rounded hover:bg-gray-100" title="Export">
          <FileDown size={20} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
