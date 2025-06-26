"use client";
import React from "react";
import clsx from "clsx";
import { Link2, MoreHorizontal } from "lucide-react";
import { Role } from "@/types/message";
import { roleColors } from "@/lib/utils/roleColors";

interface ChatHeaderProps {
  title: string;
  role: Role | null;
  adminInfo?: { username?: string; email?: string } | null;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, role, adminInfo }) => {
  return (
    <header className="sticky top-0 z-10 bg-white border-b flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <input
          className="font-bold text-lg bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-blue-500 transition w-48"
          value={title || "Chat"}
          readOnly
        />
        <span
          className={clsx(
            "ml-2 px-2 py-1 rounded text-xs font-semibold",
            roleColors[role || "viewer"]
          )}
        >
          {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Viewer"}
        </span>
        {adminInfo && (
          <span className="ml-2 text-xs text-gray-500">
            {adminInfo.username || adminInfo.email}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded hover:bg-gray-100" title="Invite">
          <Link2 size={20} />
        </button>
        <button className="p-2 rounded hover:bg-gray-100" title="Settings">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;
