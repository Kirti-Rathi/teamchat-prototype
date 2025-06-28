"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AcceptInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const acceptInvite = async () => {
      const inviteId = searchParams.get("invite");
      if (!inviteId) {
        setStatus("error");
        setError("No invite ID provided");
        return;
      }

      try {
        // console.log('Sending invite acceptance request...');
        const response = await fetch("/api/accept-invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // This ensures cookies are sent with the request
          body: JSON.stringify({ inviteId }),
        });

        const data = await response.json();
        // console.log('API Response:', { status: response.status, data });

        // Check if invite was already accepted and backend tells you so
        if (data.alreadyAccepted && data.chatId) {
          setStatus("success");
          setTimeout(() => {
            router.push(`/chat/${data.chatId}`);
          }, 2000);
          return;
        }

        // If it's a real error (e.g. malformed or revoked invite), handle it
        if (!response.ok) {
          throw new Error(data.error || "Failed to accept invite");
        }

        // Normal flow: invite accepted for the first time
        setStatus("success");
        // Redirect to the chat after a short delay
        setTimeout(() => {
          router.push(`/chat/${data.chatId}`);
        }, 2000);
      } catch (err) {
        console.error("Error accepting invite:", err);
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to accept invite"
        );
      }
    };

    acceptInvite();
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Accepting invite...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p>Invite accepted! Redirecting to chat...</p>
      </div>
    </div>
  );
}
