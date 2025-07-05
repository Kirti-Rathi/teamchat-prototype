"use client";

import React, { useState } from "react";
import { Role, Invite, InviteModalProps } from "../types";

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [input, setInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("viewer");
  const [invites, setInvites] = useState<Invite[]>([]);

  if (!isOpen) return null;

  const handleAddEmail = () => {
    const email = input.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) return;

    if (invites.some((i) => i.email === email)) return;

    setInvites((prev) => [...prev, { email, role: selectedRole }]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleRemove = (email: string) => {
    setInvites((prev) => prev.filter((i) => i.email !== email));
  };

  const handleRoleChange = (email: string, role: Role) => {
    setInvites((prev) =>
      prev.map((i) => (i.email === email ? { ...i, role } : i))
    );
  };

  const handleSend = () => {
    if (invites.length > 0) {
      onSend(invites);
      setInvites([]);
      setSelectedRole("viewer");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-1">Invite People</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Enter email(s) and assign roles
        </p>

        {/* Email & Role Input Row */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type email and press Enter"
            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-sm focus:outline-none"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as Role)}
            className="text-sm border border-zinc-300 dark:border-zinc-700 rounded px-2 py-2 bg-white dark:bg-zinc-900"
          >
            <option value="viewer">Viewer</option>
            <option value="guest">Guest</option>
            <option value="member">Member</option>
          </select>
        </div>

        {/* Email Chips */}
        <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
          {invites.map((invite) => (
            <div
              key={invite.email}
              className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded"
            >
              <span className="text-sm">{invite.email}</span>
              <div className="flex items-center gap-2">
                <select
                  value={invite.role}
                  onChange={(e) =>
                    handleRoleChange(invite.email, e.target.value as Role)
                  }
                  className="text-sm border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-900"
                >
                  <option value="viewer">Viewer</option>
                  <option value="guest">Guest</option>
                  <option value="member">Member</option>
                </select>
                <button
                  onClick={() => handleRemove(invite.email)}
                  className="text-zinc-400 hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={invites.length === 0}
            className="px-4 py-2 rounded text-sm bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
          >
            Send Invites
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
