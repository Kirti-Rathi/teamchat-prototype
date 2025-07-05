// MessageInput.tsx (Main component)
import React from "react";
import InputArea from "./InputArea";
import SubmitButton from "./SubmitButton";
import ExportButton from "./ExportButton";
import { MessageInputProps } from "../types";

export default function MessageInput({
  input,
  setInput,
  handleSend,
  canSend,
  loading,
  aiLoading,
}: MessageInputProps) {
  return (
    <form
      onSubmit={handleSend}
      className="sticky bottom-0 z-10 bg-white border-t flex gap-2 px-6 py-4"
      autoComplete="off"
    >
      <InputArea
        input={input}
        setInput={setInput}
        canSend={canSend}
        loading={loading}
        aiLoading={aiLoading}
        handleSend={handleSend}
      />

      <SubmitButton
        canSend={canSend}
        input={input}
        loading={loading}
        aiLoading={aiLoading}
      />

      <ExportButton />
    </form>
  );
}
