"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Message, Role } from '@/types/message';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';
import ChatHeader from '@/components/chat/ChatHeader';
import ErrorBanner from '@/components/chat/ErrorBanner';
import { useParams } from "next/navigation";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from '@supabase/supabase-js';
import { useUserRole } from '@/hooks/useUserRole';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatMetadata } from '@/hooks/useChatMetadata';
import { getInitials } from '@/lib/utils/getInitials';

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

const ChatRoomNew = () => {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { user } = useUser();
  const { session } = useSession();
  const client = createClerkSupabaseClient(session);

  // State
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserInitials, setCurrentUserInitials] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks
  const role = useUserRole(chatId, user?.id, session);
  const { messages, loading: messagesLoading } = useChatMessages(chatId, session);
  const { chatTitle, adminInfo } = useChatMetadata(chatId, session);

  // Effects
  useEffect(() => {
    if (user?.email) {
      setCurrentUserInitials(getInitials(user.email));
    }
  }, [user]);

  // Message sending
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.id || !chatId) return;
    
    setLoading(true);
    setError("");

    try {
      // Insert user message
      const { error: msgError } = await client.from("messages").insert({
        chat_id: chatId,
        user_id: user.id,
        sender_type: "user",
        content: input.trim(),
      });

      if (msgError) {
        throw new Error(msgError.message);
      }

      setInput("");

      // Get message context
      const { data: lastMessages } = await client
        .from("messages")
        .select("content, sender_type, user_id")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(20);

      const contextMessages = (lastMessages || []).reverse();
      const geminiContext = contextMessages.map((msg: any) => ({
        role: msg.sender_type === "ai" ? "assistant" : "user",
        content: msg.content,
      }));

      const lastMsg = contextMessages[contextMessages.length - 1];
      if (!lastMsg || lastMsg.content !== input.trim()) {
        geminiContext.push({ role: "user", content: input.trim() });
      }

      // Get AI response
      let aiReply = "[Gemini AI reply placeholder]";
      setAiLoading(true);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: geminiContext }),
        });

        const data = await res.json();
        aiReply = data.reply || aiReply;

        if (!data.reply) {
          throw new Error("AI did not return a reply");
        }

        // Store AI response
        const { error: aiMsgError } = await client.from("messages").insert({
          chat_id: chatId,
          user_id: null,
          sender_type: "ai",
          content: aiReply,
        });

        if (aiMsgError) {
          throw new Error(aiMsgError.message);
        }
      } catch (err) {
        setError("AI error: " + (err as Error).message);
        aiReply = "Sorry, I couldn't generate a reply.";
      } finally {
        setAiLoading(false);
      }
    } catch (err) {
      setError("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Permissions
  const canSend =
    (role === "admin" || role === "member" || role === "guest") &&
    !loading &&
    !aiLoading;
  const canInvite = role === "admin" || role === "member";
  const isViewer = role === "viewer";

  return (
    <div className="flex-1 flex flex-col h-full overflow-x-hidden">
      <ChatHeader 
        title={chatTitle} 
        role={role} 
        adminInfo={adminInfo}
      />
      
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList
            messages={messages}
            currentUserInitials={currentUserInitials}
            loading={messagesLoading}
            messagesEndRef={messagesEndRef}
          />
        </div>

        <ErrorBanner error={error} />

        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSend={handleSend}
          disabled={!canSend}
          loading={loading || aiLoading}
        />
      </main>
    </div>
  );
};

export default ChatRoomNew;