// SubmitButton.tsx
import React from "react";
import clsx from "clsx";
import { Pause, Send } from "lucide-react";
import { SubmitButtonProps } from "../types";

export default function SubmitButton({
  canSend,
  input,
  loading,
  aiLoading,
}: SubmitButtonProps) {
  return (
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
  );
}
