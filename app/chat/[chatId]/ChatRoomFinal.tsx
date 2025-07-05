// ChatRoom.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Header from "@/components/chat/Header/Header";
import { SupabaseClient } from "@supabase/supabase-js";
import { Message, Role } from "@/components/chat/types";
import MessageArea from "@/components/chat/MessageArea/MessageArea";
import MessageInput from "@/components/chat/MessageInput/MessageInput";

type ChatRoomProps = {
  client: SupabaseClient;
};

async function fetcher(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

export default function ChatRoomFinal({ client }: ChatRoomProps) {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [input, setInput] = useState("");
  // const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminInfo, setAdminInfo] = useState<{
    email?: string;
    username?: string;
  } | null>(null);
  const [chatTitle, setChatTitle] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch role and chat info
  useEffect(() => {
    if (!user?.id || !chatId) return;

    const fetchRoleAndChat = async () => {
      try {
        // Check if user is the creator of the chat
        const { data: chatData } = await client
          .from("chats")
          .select("created_by, title, workspace_id")
          .eq("id", chatId)
          .single();

        if (chatData) {
          setChatTitle(chatData.title);
          setWorkspaceId(chatData.workspace_id);

          // If user is the creator, they're an admin
          if (chatData.created_by === user.id) {
            setRole("admin");
            // No need to check further if user is the creator
            return;
          }
        }

        // First, check if user has a role in chat_user_roles
        const { data: roleData, error: roleError } = await client
          .from("chat_user_roles")
          .select("role")
          .eq("chat_id", chatId)
          .eq("user_id", user.id)
          .single();

        if (roleData?.role) {
          console.log("User has role:", roleData.role);
          setRole(roleData.role);
          return;
        }

        // If no role found, check for any accepted invites
        const { data: acceptedInvite } = await client
          .from("chat_invites")
          .select("*")
          .eq("chat_id", chatId)
          .eq("email", user.primaryEmailAddress?.emailAddress)
          .eq("accepted", true)
          .single();

        if (acceptedInvite) {
          console.log(
            "User has accepted invite with role:",
            acceptedInvite.role
          );
          setRole(acceptedInvite.role as Role);
          return;
        }

        // Check for pending invite
        const { data: pendingInvite } = await client
          .from("chat_invites")
          .select("*")
          .eq("chat_id", chatId)
          .eq("email", user.primaryEmailAddress?.emailAddress)
          .eq("accepted", false)
          .single();

        if (pendingInvite) {
          console.log("User has pending invite");
          setRole(null);
          return;
        }

        // Default to viewer if no role or invite found
        console.log("No role or invite found, defaulting to viewer");
        setRole("viewer");

        // Fetch admin info if not already set
        if (chatData?.created_by && !adminInfo) {
          const { data: adminData } = await client
            .from("users")
            .select("email, username")
            .eq("id", chatData.created_by)
            .single();
          setAdminInfo(adminData);
        }
      } catch (error) {
        console.error("Error fetching role or chat info:", error);
        setRole("viewer");
      }
    };

    fetchRoleAndChat();
  }, [user?.id, chatId, user?.primaryEmailAddress?.emailAddress]);

  // 🔁 1️⃣ SWR hook to load chat‐level contexts
  const {
    data: chatContexts,
    error: chatError,
    mutate: mutateChatContexts,
  } = useSWR(chatId ? `/api/chat/${chatId}/contexts` : null, fetcher);

  // 🗂 2️⃣ Upload a chat‐context file
  async function handleChatFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const path = `chat_${chatId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadErr } = await client.storage
      .from("contexts")
      .upload(path, file);

    if (uploadErr) {
      console.error("Chat upload error:", uploadErr.message);
      return;
    }

    const { data: urlData } = client.storage
      .from("contexts")
      .getPublicUrl(uploadData.path);
    const publicUrl = urlData.publicUrl;

    const { error: dbErr } = await client.from("chat_contexts").insert({
      chat_id: chatId,
      uploaded_by: user.id,
      file_name: file.name,
      storage_path: uploadData.path,
      public_url: publicUrl,
    });

    if (dbErr) {
      console.error("Chat DB insert error:", dbErr.message);
      return;
    }

    mutateChatContexts();
  }

  // 🗑 3️⃣ Delete a chat‐context file
  async function handleRemoveChatContext(id: string, storagePath: string) {
    if (!confirm("Delete this context file?")) return;

    // 1. delete metadata
    const { error: dbErr } = await client
      .from("chat_contexts")
      .delete()
      .eq("id", id);
    if (dbErr) {
      console.error("Chat context delete error:", dbErr.message);
      return;
    }

    // 2. delete from storage
    const { error: storageErr } = await client.storage
      .from("contexts")
      .remove([storagePath]);
    if (storageErr) {
      console.error("Storage delete error:", storageErr.message);
    }

    await mutateChatContexts();
  }

  // Fetch messages
  useEffect(() => {
    if (!chatId) return;
    setIsInitialLoading(true);
    client
      .from("messages")
      .select("*", { count: "exact" })
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (data) setMessages(data);
        setIsInitialLoading(false);
      });
  }, [chatId]);

  // Realtime subscription with improved handling
  useEffect(() => {
    if (!chatId) return;

    // Create a new channel for real-time updates
    const channel = client
      .channel(`messages:chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log("Received real-time update:", payload);
          // Update messages with optimistic update first
          setMessages((prev) => [...prev, payload.new as Message]);
          // Then refetch to ensure consistency
          // client
          //   .from("messages")
          //   .select("*")
          //   .eq("chat_id", chatId)
          //   .order("created_at", { ascending: true })
          //   .then(({ data, error }) => {
          //     if (error) console.error('Error refetching messages:', error);
          //     if (data) setMessages(data);
          //   });
        }
      )
      .subscribe();

    // Initial fetch when subscription is established
    channel.on("status", (status) => {
      console.log("Subscription status:", status);
      if (status === "SUBSCRIBED") {
        client
          .from("messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true })
          .then(({ data, error }) => {
            if (error) console.error("Error fetching initial messages:", error);
            if (data) setMessages(data);
          });
      }
    });

    return () => {
      channel.unsubscribe();
      // client.removeAllChannels();
    };
  }, [chatId]);

  // Scroll to bottom on new message with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle sending invites
  const handleSendInvites = async (
    invites: { email: string; role: string }[]
  ) => {
    try {
      // First, insert the invites into the database
      const { data: insertedInvites, error } = await client
        .from("chat_invites")
        .insert(
          invites.map((invite) => ({
            chat_id: chatId,
            email: invite.email,
            role: invite.role,
            invited_by: user?.id || null,
          }))
        )
        .select();

      if (error) throw error;

      // Send email notifications for each invite
      const emailPromises = invites.map(async (invite, index) => {
        try {
          const response = await fetch("/api/send-invite", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inviteId: insertedInvites?.[index]?.id, // Get the ID of the inserted invite
              inviteeEmail: invite.email,
              inviterName: user?.fullName || user?.username || "Someone",
              chatTitle: chatTitle || "a chat",
              role: invite.role,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("Failed to send invite email:", error);
          }
        } catch (err) {
          console.error("Error sending invite email:", err);
        }
      });

      // Wait for all email sends to complete (but don't block the UI)
      await Promise.all(emailPromises);

      return { success: true };
    } catch (err) {
      console.error("Error sending invites:", err);
      return { success: false, error: err };
    }
  };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const userInput = input.trim();

    if (!userInput || !user?.id || !chatId) return;

    setIsSending(true);
    setError("");

    // Fetch context
    const { data: lastMessages, error: fetchError } = await client
      .from("messages")
      .select("content, sender_type, user_id")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (fetchError) {
      setError(fetchError.message);
      setIsSending(false);
      return;
    }

    // Insert user message
    const { error: insertError } = await client.from("messages").insert({
      chat_id: chatId,
      user_id: user.id,
      sender_type: "user",
      content: userInput,
    });

    if (insertError) {
      setError(insertError.message);
      setIsSending(false);
      return;
    }

    // Build context for Gemini
    const contextMessages = (lastMessages || []).reverse();
    const geminiContext = contextMessages.map((msg: any) => ({
      role: msg.sender_type === "ai" ? "assistant" : "user",
      content: msg.content,
    }));
    geminiContext.push({ role: "user", content: userInput });

    setInput("");
    setIsSending(false);
    setAiLoading(true);

    // Call Gemini API for streaming response
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: geminiContext }),
      });

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";
      let updateCounter = 0;
      let lastUpdateTime = Date.now();

      // Insert placeholder AI message into DB
      const { data: insertedAiMsg, error: insertError } = await client
        .from("messages")
        .insert({
          chat_id: chatId,
          user_id: null,
          sender_type: "ai",
          content: "",
        })
        .select()
        .single();

      if (insertError || !insertedAiMsg?.id) throw insertError;

      const msgId = insertedAiMsg.id;

      // Add initial message in UI
      // setMessages((prev) => [...prev, { ...insertedAiMsg, content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        for (const char of chunk) {
          fullText += char;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? {
                    ...m,
                    content: fullText + "▍",
                    updated_at: new Date().toISOString(),
                  }
                : m
            )
          );

          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

          await new Promise((res) => setTimeout(res, 3));

          updateCounter++;

          if (updateCounter >= 20 || Date.now() - lastUpdateTime > 500) {
            await client
              .from("messages")
              .update({ content: fullText })
              .eq("id", msgId);
            updateCounter = 0;
            lastUpdateTime = Date.now();
          }
        }
      }

      // Final content update (removes ▍ and stores final content)
      await client
        .from("messages")
        .update({ content: fullText })
        .eq("id", msgId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                content: fullText,
                updated_at: new Date().toISOString(),
              }
            : m
        )
      );

      if (!fullText.trim()) {
        await client.from("messages").delete().eq("id", msgId);
        setError("AI did not return any reply.");
      }
    } catch (err: any) {
      console.error("Streaming error:", err);
      setError("AI error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  // Helper: get user initials
  function getInitials(name: string | null | undefined) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  // Role-based permissions
  const canSend = role === "admin" || role === "member" || role === "guest";
  const canInvite = role === "admin" || role === "member";
  const isViewer = role === "viewer" || !role;

  return (
    <div className="flex-1 flex flex-col h-full overflow-x-hidden">
      <Header
        chatTitle={chatTitle}
        role={role}
        adminInfo={adminInfo}
        chatError={chatError}
        chatContexts={chatContexts}
        handleChatFileChange={handleChatFileChange}
        handleRemoveChatContext={handleRemoveChatContext}
        handleSendInvites={handleSendInvites}
      />

      <MessageArea
        loading={isInitialLoading}
        messages={messages}
        user={user}
        messagesEndRef={messagesEndRef}
      />

      <MessageInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        canSend={canSend}
        loading={isSending}
        aiLoading={aiLoading}
      />
    </div>
  );
}
