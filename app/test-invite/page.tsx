"use client";

import InviteModal from "@/components/chat/InviteModalNew";
import { useState } from "react";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = (
    invites: { email: string; role: "viewer" | "guest" | "member" }[]
  ) => {
    alert(JSON.stringify(invites, null, 2));
    // Call your backend here
  };

  return (
    <div className="p-10">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Invite People
      </button>

      <InviteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSend={handleSend}
      />
    </div>
  );
}
