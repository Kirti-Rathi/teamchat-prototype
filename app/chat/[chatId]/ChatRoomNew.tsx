"use client";

import { useUser, useSession } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useState } from "react";
import {createClient} from "@supabase/supabase-js";

import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import ErrorBanner from "@/components/chat/ErrorBanner";

import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatMetadata } from "@/hooks/useChatMetadata";
import { useUserRole } from "@/hooks/useUserRole";
import { getInitials } from "@/lib/utils/getInitials";

export default function ChatRoomPage() {
  const params = useParams();
  const chatId = params?.chatId as string;

  const { user } = useUser();
  const { session } = useSession();

  function createClerkSupabaseClient(session: any) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        async accessToken() {
          return session?.getToken() ?? null;
        },
      }
    );
  }

  const { chatTitle, workspaceName, adminInfo } = useChatMetadata(chatId, session);
  const role = useUserRole(chatId, user?.id, session);
  const { messages, setMessages, loading, messagesEndRef } = useChatMessages(chatId, session);

  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  const canSend =
    (role === "admin" || role === "member" || role === "guest") &&
    !loading &&
    !aiLoading;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.id || !chatId) return;

    setError("");
    setInput("");
    const client = createClerkSupabaseClient(session);

    const { error: insertError } = await client.from("messages").insert({
      chat_id: chatId,
      user_id: user.id,
      sender_type: "user",
      content: input.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Fetch last 20 messages for Gemini context
    const { data: lastMessages } = await client
      .from("messages")
      .select("content, sender_type")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(20);

    const geminiContext = (lastMessages || [])
      .reverse()
      .map((msg) => ({
        role: msg.sender_type === "ai" ? "assistant" : "user",
        content: msg.content,
      }));

    geminiContext.push({ role: "user", content: input.trim() });

    try {
      setAiLoading(true);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: geminiContext }),
      });
      const data = await res.json();
      const aiReply = data.reply;

      if (aiReply) {
        const { error: aiError } = await client.from("messages").insert({
          chat_id: chatId,
          user_id: null,
          sender_type: "ai",
          content: aiReply,
        });

        if (aiError) setError("Failed to save AI response");
      } else {
        setError("AI did not return a reply.");
      }
    } catch (err: any) {
      setError("AI error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ChatHeader
            title={chatTitle}
            role={role}
            adminInfo={adminInfo}
        />

        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
            <MessageList
            messages={messages}
            loading={loading}
            currentUserInitials={getInitials(user?.firstName || user?.username || "User")}
            messagesEndRef={messagesEndRef}
            />
        </div>

        <ChatInput
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            canSend={canSend}
            aiLoading={aiLoading}
            loading={loading}
        />

        {error && <ErrorBanner message={error} />}
    </div>
  );
}

