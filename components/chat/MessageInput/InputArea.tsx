// InputArea.tsx
import React from "react";
import { InputAreaProps } from "../types";

export default function InputArea({
  input,
  setInput,
  canSend,
  loading,
  aiLoading,
  handleSend,
}: InputAreaProps) {
  return (
    <textarea
      className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring resize-none min-h-[40px] max-h-32"
      placeholder={canSend ? "Type a message..." : "You have read-only access"}
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
  );
}
