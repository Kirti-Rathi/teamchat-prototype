"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import useSWR from "swr";
import { useUser, useSession } from "@clerk/nextjs";
// import createClerkSupabaseClient from "@/lib/supabaseClient";
import { Message, Role } from "@/types/message";
import { roleColors } from "@/lib/utils/formatRoleLabel";
import { useParams } from "next/navigation";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { Send, Pause, MoreHorizontal, FileDown, UserPlus } from "lucide-react";
import dynamic from "next/dynamic";
import { Upload, FileText, Trash } from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";
// import { ChatHeader } from "@/components/chat/ChatHeader";
import Header from "@/components/chat/Header";

type ChatRoomProps = {
  client: SupabaseClient;
};

const InviteModal = dynamic(
  () => import("@/components/chat/Header/InviteModal"),
  {
    ssr: false,
  }
);

// a tiny fetcher that passes through Clerk tokens
async function fetcher(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

export default function ChatRoom({ client }: ChatRoomProps) {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { user } = useUser();
  // const { session } = useSession();
  // const client = useMemo(() => createClerkSupabaseClient(session), [session]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminInfo, setAdminInfo] = useState<{
    email?: string;
    username?: string;
  } | null>(null);
  const [chatTitle, setChatTitle] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
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
    setLoading(true);
    client
      .from("messages")
      .select("*", { count: "exact" })
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (data) setMessages(data);
        setLoading(false);
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

  // Send message
  // async function handleSend(e: React.FormEvent) {
  //   e.preventDefault();
  //   if (!input.trim() || !user?.id || !chatId) return;
  //   setLoading(true);
  //   setError("");
  //   // Insert user message
  //   const { error: msgError } = await client.from("messages").insert({
  //     chat_id: chatId,
  //     user_id: user.id,
  //     sender_type: "user",
  //     content: input.trim(),
  //   });
  //   if (msgError) {
  //     setError(msgError.message);
  //     setLoading(false);
  //     return;
  //   }
  //   setInput("");
  //   setLoading(false);

  //   // Fetch last 20 messages for context
  //   const { data: lastMessages } = await client
  //     .from("messages")
  //     .select("content, sender_type, user_id")
  //     .eq("chat_id", chatId)
  //     .order("created_at", { ascending: false })
  //     .limit(20);
  //   const contextMessages = (lastMessages || []).reverse();
  //   // Format for Gemini
  //   const geminiContext = contextMessages.map((msg: any) => ({
  //     role: msg.sender_type === "ai" ? "assistant" : "user",
  //     content: msg.content,
  //   }));
  //   // geminiContext.push({ role: "user", content: input.trim() });
  //   const lastMsg = contextMessages[contextMessages.length - 1];
  //   if (!lastMsg || lastMsg.content !== input.trim()) {
  //     geminiContext.push({ role: "user", content: input.trim() });
  //   }

  //   // Call Gemini API via /api/ai
  //   let aiReply = "[Gemini AI reply placeholder]";
  //   setAiLoading(true);
  //   try {
  //     const res = await fetch("/api/ai", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ context: geminiContext }),
  //     });
  //     const data = await res.json();
  //     aiReply = data.reply || aiReply;
  //     if (!data.reply) {
  //       setError("AI did not return a reply.");
  //     }
  //     // Insert AI reply only if we got a response
  //     if (aiReply && aiReply !== "[Gemini AI reply placeholder]") {
  //       const { error: aiMsgError } = await client.from("messages").insert({
  //         chat_id: chatId,
  //         user_id: null,
  //         sender_type: "ai",
  //         content: aiReply,
  //       });
  //       if (aiMsgError) {
  //         setError("Failed to store AI message: " + aiMsgError.message);
  //       }
  //       // Do NOT optimistically update UI here; real-time will handle it
  //     }
  //   } catch (err) {
  //     setError("AI error: " + (err as Error).message);
  //     aiReply = "Sorry, I couldn't generate a reply.";
  //   } finally {
  //     setAiLoading(false);
  //   }
  // }
  //   async function handleSend(e: React.FormEvent) {
  //     e.preventDefault();
  //     if (!input.trim() || !user?.id || !chatId) return;
  //     setLoading(true);
  //     setError("");

  //     // Insert user message
  //     const userInput = input.trim();
  //     const { error: msgError } = await client.from("messages").insert({
  //       chat_id: chatId,
  //       user_id: user.id,
  //       sender_type: "user",
  //       content: userInput,
  //     });

  //     if (msgError) {
  //       setError(msgError.message);
  //       setLoading(false);
  //       return;
  //     }

  //     setInput("");
  //     setLoading(false);
  //     setAiLoading(true);

  //     // Fetch context
  //     const { data: lastMessages } = await client
  //       .from("messages")
  //       .select("content, sender_type, user_id")
  //       .eq("chat_id", chatId)
  //       .order("created_at", { ascending: false })
  //       .limit(20);

  //     const contextMessages = (lastMessages || []).reverse();
  //     const geminiContext = contextMessages.map((msg: any) => ({
  //       role: msg.sender_type === "ai" ? "assistant" : "user",
  //       content: msg.content,
  //     }));
  //     geminiContext.push({ role: "user", content: userInput });

  //     try {
  //       const response = await fetch("/api/ai", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ context: geminiContext }),
  //       });

  //       if (!response.body) {
  //         throw new Error("No response stream");
  //       }

  //       const reader = response.body.getReader();
  //       const decoder = new TextDecoder("utf-8");
  //       let fullText = "";

  //       // Insert placeholder AI message into DB
  //       const { data: insertedAiMsg, error: insertError } = await client
  //         .from("messages")
  //         .insert({
  //           chat_id: chatId,
  //           user_id: null,
  //           sender_type: "ai",
  //           content: "",
  //         })
  //         .select()
  //         .single();

  //       if (insertError || !insertedAiMsg?.id) throw insertError;

  //       const msgId = insertedAiMsg.id;

  //       // Add AI message to local state immediately
  //       // setMessages((prev) => [
  //       //   ...prev,
  //       //   {
  //       //     id: msgId,
  //       //     chat_id: chatId,
  //       //     user_id: null,
  //       //     sender_type: "ai",
  //       //     content: "",
  //       //     created_at: new Date().toISOString(),
  //       //     updated_at: new Date().toISOString(),
  //       //   },
  //       // ]);

  //       // Start streaming
  //       // while (true) {
  //       //   const { done, value } = await reader.read();
  //       //   if (done) break;

  //       //   const chunk = decoder.decode(value);
  //       //   fullText += chunk;

  //       //   // Update local message state
  //       //   setMessages((prev) =>
  //       //     prev.map((m) =>
  //       //       m.id === msgId
  //       //         ? {
  //       //             ...m,
  //       //             content: fullText,
  //       //             updated_at: new Date().toISOString(),
  //       //           }
  //       //         : m
  //       //     )
  //       //   );

  //       //   // Also update in DB
  //       //   await client
  //       //     .from("messages")
  //       //     .update({ content: fullText })
  //       //     .eq("id", msgId);
  //       // }
  //       let updateCounter = 0;
  // let lastUpdateTime = Date.now();

  // while (true) {
  //   const { done, value } = await reader.read();
  //   if (done) break;

  //   const chunk = decoder.decode(value);

  //   for (const char of chunk) {
  //     fullText += char;

  //     // Update local message in state (typing effect)
  //     setMessages((prev) =>
  //       prev.map((m) =>
  //         m.id === msgId
  //           ? {
  //               ...m,
  //               content: fullText + "▍", // Optional blinking cursor
  //               updated_at: new Date().toISOString(),
  //             }
  //           : m
  //       )
  //     );

  //     await new Promise((res) => setTimeout(res, 3)); // Typing speed

  //     updateCounter++;

  //     // Debounced DB update (every 20 chars or 500ms)
  //     if (updateCounter >= 20 || Date.now() - lastUpdateTime > 500) {
  //       await client
  //         .from("messages")
  //         .update({ content: fullText })
  //         .eq("id", msgId);
  //       updateCounter = 0;
  //       lastUpdateTime = Date.now();
  //     }
  //   }
  // }

  // // Final update to remove cursor and save final content
  // await client
  //   .from("messages")
  //   .update({ content: fullText })
  //   .eq("id", msgId);

  // // Final UI update
  // setMessages((prev) =>
  //   prev.map((m) =>
  //     m.id === msgId
  //       ? {
  //           ...m,
  //           content: fullText,
  //           updated_at: new Date().toISOString(),
  //         }
  //       : m
  //   )
  // );

  //       if (!fullText.trim()) {
  //         // Delete empty AI reply
  //         await client.from("messages").delete().eq("id", msgId);
  //         setError("AI did not return any reply.");
  //       }
  //     } catch (err: any) {
  //       console.error("Streaming error:", err);
  //       setError("AI error: " + err.message);
  //     } finally {
  //       setAiLoading(false);
  //     }
  //   }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user?.id || !chatId) return;

    setLoading(true);
    setError("");

    const userInput = input.trim();

    // Insert user message
    const { error: msgError } = await client.from("messages").insert({
      chat_id: chatId,
      user_id: user.id,
      sender_type: "user",
      content: userInput,
    });

    if (msgError) {
      setError(msgError.message);
      setLoading(false);
      return;
    }

    setInput("");
    setLoading(false);
    setAiLoading(true);

    // Fetch context
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
    geminiContext.push({ role: "user", content: userInput });

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
      {/* Chat Header */}
      <header className="sticky top-0 z-10 bg-white border-b flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <input
            className="font-bold text-lg bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-blue-500 transition w-48"
            value={chatTitle || "Chat"}
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
          <section className="px-6 py-4 border-b bg-white">
            <h2 className="font-semibold">📁 Chat Context Files</h2>
            <label
              htmlFor="chat-file-upload"
              className="inline-flex items-center gap-1 mt-2 mb-4 cursor-pointer bg-green-600 text-white px-3 py-1 rounded"
            >
              <Upload className="w-4 h-4" />
              Upload Context
              <input
                id="chat-file-upload"
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleChatFileChange}
                className="hidden"
              />
            </label>

            {chatError && (
              <p className="text-red-500">Failed to load chat contexts.</p>
            )}
            {!chatContexts ? (
              <p className="text-gray-600">Loading chat contexts…</p>
            ) : chatContexts.length === 0 ? (
              <p className="text-gray-400 italic">
                No chat‐level context files.
              </p>
            ) : (
              <div className="space-y-2">
                {chatContexts.map((ctx: any) => (
                  <div
                    key={ctx.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <a
                      href={ctx.public_url}
                      target="_blank"
                      className="flex items-center gap-1 text-green-700 hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      {ctx.file_name}
                    </a>
                    <button
                      onClick={() =>
                        handleRemoveChatContext(ctx.id, ctx.storage_path)
                      }
                      className="text-gray-500 hover:text-red-600"
                      aria-label="Delete context"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            className="p-2 rounded hover:bg-gray-100"
            title="Invite"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus size={20} />
          </button>
          <button className="p-2 rounded hover:bg-gray-100" title="Settings">
            <MoreHorizontal size={20} />
          </button>
        </div>
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSend={handleSendInvites}
        />
      </header>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 bg-gray-50">
        {loading ? (
          <div className="text-gray-400 text-center animate-pulse">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-gray-400 text-center">No messages yet.</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                "flex group",
                msg.sender_type === "ai" ? "justify-start" : "justify-end"
              )}
            >
              {msg.sender_type === "ai" && (
                <div className="flex flex-col items-center mr-2">
                  <div className="w-8 h-8 bg-blue-200 text-blue-900 rounded-full flex items-center justify-center font-bold">
                    AI
                  </div>
                </div>
              )}
              <div
                className={clsx(
                  "w-fit max-w-xl px-4 py-2 rounded-lg shadow-sm text-sm relative break-words overflow-wrap",
                  msg.sender_type === "ai"
                    ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 self-start"
                    : "bg-white text-gray-900 self-end border"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    {msg.sender_type === "ai"
                      ? "Gemini AI"
                      : getInitials(
                          user?.firstName || user?.username || "User"
                        )}
                  </span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {msg.sender_type === "ai" ? (
                  <div className="break-words overflow-wrap">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          return (
                            <code
                              className={clsx(
                                className,
                                "bg-gray-200 rounded px-1 py-0.5 text-xs font-mono break-words"
                              )}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        pre({ node, className, children, ...props }) {
                          return (
                            <pre
                              className="bg-gray-200 rounded p-2 text-xs font-mono break-words whitespace-pre-wrap overflow-x-auto"
                              {...props}
                            >
                              {children}
                            </pre>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    <div ref={messagesEndRef} className="h-px" />
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.sender_type === "user" && (
                <div className="flex flex-col items-center ml-2">
                  <div className="w-8 h-8 bg-gray-200 text-gray-900 rounded-full flex items-center justify-center font-bold">
                    {getInitials(user?.firstName || user?.username || "User")}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="sticky bottom-0 z-10 bg-white border-t flex gap-2 px-6 py-4"
        autoComplete="off"
      >
        <textarea
          className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring resize-none min-h-[40px] max-h-32"
          placeholder={
            canSend ? "Type a message..." : "You have read-only access"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!canSend || loading || aiLoading}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button
          type="submit"
          className={clsx(
            "flex items-center gap-1 px-4 py-2 rounded font-semibold transition",
            canSend && input.trim() && !aiLoading && !loading
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
          disabled={!canSend || !input.trim()}
          title={aiLoading || loading ? "Pause" : "Send"}
        >
          {aiLoading || loading ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          <span className="sr-only">Send</span>
        </button>
        {/* Export menu placeholder */}
        <div className="ml-2 relative">
          <button className="p-2 rounded hover:bg-gray-100" title="Export">
            <FileDown size={20} />
          </button>
          {/* Export dropdown (not implemented) */}
        </div>
      </form>
      {error && <div className="text-red-500 text-center py-2">{error}</div>}
    </div>
  );
}
