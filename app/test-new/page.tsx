"use client";

import InviteModal from "@/components/chat/InviteModal";
import { useState } from "react";

const TestNew = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleSendInvites = (invites: { email: string; role: string }[]) => {
    alert(JSON.stringify(invites, null, 2));
    console.log("Sending invites:", invites);
    // handle sending invites (e.g., API call)
    setModalOpen(false); // close modal after sending
  };

  return (
    <>
      <button onClick={() => setModalOpen(true)}>Open Invite Modal</button>
      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSend={handleSendInvites}
      />
    </>
  );
};

export default TestNew;
