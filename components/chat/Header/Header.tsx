// Header.tsx (Main Header Component)
import { UserPlus, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import ContextFilesSection from "./ContextFilesSection";
import InviteModal from "./InviteModal";
import { RoleBadge } from "./RoleBadge";
import { HeaderProps } from "../types";

export default function Header({
  chatTitle,
  role,
  adminInfo,
  chatError,
  chatContexts,
  handleChatFileChange,
  handleRemoveChatContext,
  handleSendInvites,
}: HeaderProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-white border-b flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <input
          className="font-bold text-lg bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-blue-500 transition w-48"
          value={chatTitle || "Chat"}
          readOnly
        />
        <RoleBadge role={role} />
        {adminInfo && (
          <span className="ml-2 text-xs text-gray-500">
            {adminInfo.username || adminInfo.email}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <ContextFilesSection
          chatError={chatError}
          chatContexts={chatContexts}
          handleChatFileChange={handleChatFileChange}
          handleRemoveChatContext={handleRemoveChatContext}
        />

        <button
          className="p-2 rounded hover:bg-gray-100"
          title="Invite"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <UserPlus size={20} />
        </button>
        <button className="p-2 rounded hover:bg-gray-100" title="Settings">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSend={handleSendInvites}
      />
    </header>
  );
}
