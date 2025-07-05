// pages/test-accept.tsx
"use client";
import { useState } from "react";

export default function TestAccept() {
  const [inviteId, setInviteId] = useState("");

  const handleAccept = async () => {
    const res = await fetch("/api/accept-workspace-invite", {
      method: "POST",
      body: JSON.stringify({ inviteId }),
    });

    const data = await res.json();
    console.log("Response:", data);
  };

  return (
    <div className="p-4">
      <input
        type="text"
        value={inviteId}
        onChange={(e) => setInviteId(e.target.value)}
        placeholder="Enter Invite ID"
        className="border p-2 mr-2"
      />
      <button onClick={handleAccept} className="bg-blue-500 text-white p-2">
        Test Accept Invite
      </button>
    </div>
  );
}
