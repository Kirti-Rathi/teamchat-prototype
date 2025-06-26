"use client";
import React, { useState } from "react";
import { CheckCircle, Plus, X } from "lucide-react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (invites: { email: string; role: string }[]) => void;
}

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onSend,
}) => {
  const [emailInput, setEmailInput] = useState("");
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [error, setError] = useState("");

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail) return;

    if (!isValidEmail(trimmedEmail)) {
      setError("Invalid email format");
      return;
    }

    if (invites.find((invite) => invite.email === trimmedEmail)) {
      setError("Email already added");
      return;
    }

    setInvites([...invites, { email: trimmedEmail, role: "viewer" }]);
    setEmailInput("");
    setError("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInvites(invites.filter((invite) => invite.email !== emailToRemove));
  };

  const handleRoleChange = (email: string, role: string) => {
    setInvites(
      invites.map((invite) =>
        invite.email === email ? { ...invite, role } : invite
      )
    );
  };

  const handleSend = () => {
    if (invites.length === 0) {
      setError("Please add at least one email to send invites.");
      return;
    }
    onSend(invites);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800">Invite People</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select users and assign roles
          </p>

          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <input
                type="email"
                className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
                placeholder="Type email address and press comma or enter"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
              <button
                onClick={handleAddEmail}
                className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <div className="mt-4 space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.email}
                  className="flex items-center bg-gray-100 rounded-md px-3 py-2"
                >
                  <span className="text-sm text-gray-700 mr-2">
                    {invite.email}
                  </span>
                  <select
                    className="ml-2 border rounded px-2 py-1 text-sm focus:outline-none"
                    value={invite.role}
                    onChange={(e) =>
                      handleRoleChange(invite.email, e.target.value)
                    }
                  >
                    <option value="viewer">Viewer</option>
                    <option value="guest">Guest</option>
                    <option value="member">Member</option>
                  </select>
                  <button
                    onClick={() => handleRemoveEmail(invite.email)}
                    className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <button
              className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 focus:outline-none"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none"
              onClick={handleSend}
            >
              Send Invites
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
