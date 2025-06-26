"use client";
import React, { useEffect, useRef, useState } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { Send, Pause, MoreHorizontal, Link2, FileDown } from "lucide-react";

// Types
interface Message {
  id: string;
  chat_id: string;
  user_id: string | null;
  sender_type: "ai" | "user";
  content: string;
  created_at: string;
  updated_at: string;
  user?: { email?: string };
}

type Role = "admin" | "member" | "guest" | "viewer";

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

const roleColors: Record<Role, string> = {
  admin: "bg-blue-600 text-white",
  member: "bg-green-600 text-white",
  guest: "bg-yellow-500 text-white",
  viewer: "bg-gray-400 text-white",
};

export default function ChatRoom() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { user } = useUser();
  const { session } = useSession();
  const client = createClerkSupabaseClient(session);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch role
  useEffect(() => {
    if (!user?.id || !chatId) return;
    const fetchRole = async () => {
      const { data, error } = await client
        .from("chat_user_roles")
        .select("role")
        .eq("chat_id", chatId)
        .eq("user_id", user.id)
        .single();
      if (data?.role) setRole(data.role);
      else setRole(null);
    };
    fetchRole();
  }, [user?.id, chatId]);

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

  // Fetch chat title, admin info, and workspace info
  useEffect(() => {
    if (!chatId) return;
    const fetchChat = async () => {
      const { data: chatData } = await client
        .from("chats")
        .select("title, created_by, workspace_id")
        .eq("id", chatId)
        .single();
      if (chatData) {
        setChatTitle(chatData.title);
        setWorkspaceId(chatData.workspace_id);
        // Fetch admin info
        if (chatData.created_by) {
          const { data: adminUser } = await client
            .from("users")
            .select("email, username")
            .eq("id", chatData.created_by)
            .single();
          setAdminInfo(adminUser);
        }
        // Fetch workspace name if applicable
        if (chatData.workspace_id) {
          const { data: ws } = await client
            .from("workspaces")
            .select("name")
            .eq("id", chatData.workspace_id)
            .single();
          setWorkspaceName(ws?.name || "Workspace");
        } else {
          setWorkspaceName("");
        }
      }
    };
    fetchChat();
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
          console.log('Received real-time update:', payload);
          // Update messages with optimistic update first
          setMessages((prev) => [...prev, payload.new as Message]);
          // Then refetch to ensure consistency
          client
            .from("messages")
            .select("*")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true })
            .then(({ data, error }) => {
              if (error) console.error('Error refetching messages:', error);
              if (data) setMessages(data);
            });
        }
      )
      .subscribe();

    // Initial fetch when subscription is established
    channel.on('status', (status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        client
          .from("messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true })
          .then(({ data, error }) => {
            if (error) console.error('Error fetching initial messages:', error);
            if (data) setMessages(data);
          });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [chatId]);

  // Scroll to bottom on new message with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user?.id || !chatId) return;
    setLoading(true);
    setError("");
    // Insert user message
    const { error: msgError } = await client.from("messages").insert({
      chat_id: chatId,
      user_id: user.id,
      sender_type: "user",
      content: input.trim(),
    });
    if (msgError) {
      setError(msgError.message);
      setLoading(false);
      return;
    }
    setInput("");
    setLoading(false);

    // Fetch last 20 messages for context
    const { data: lastMessages } = await client
      .from("messages")
      .select("content, sender_type, user_id")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(20);
    const contextMessages = (lastMessages || []).reverse();
    // Format for Gemini
    const geminiContext = contextMessages.map((msg: any) => ({
      role: msg.sender_type === "ai" ? "assistant" : "user",
      content: msg.content,
    }));
    geminiContext.push({ role: "user", content: input.trim() });

    // Call Gemini API via /api/ai
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
        setError("AI did not return a reply.");
      }
      // Insert AI reply only if we got a response
      if (aiReply && aiReply !== "[Gemini AI reply placeholder]") {
        const { error: aiMsgError } = await client.from("messages").insert({
          chat_id: chatId,
          user_id: null,
          sender_type: "ai",
          content: aiReply,
        });
        if (aiMsgError) {
          setError("Failed to store AI message: " + aiMsgError.message);
        }
        // Do NOT optimistically update UI here; real-time will handle it
      }
    } catch (err) {
      setError("AI error: " + (err as Error).message);
      aiReply = "Sorry, I couldn't generate a reply.";
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
  const canSend =
    (role === "admin" || role === "member" || role === "guest") &&
    !loading &&
    !aiLoading;
  const canInvite = role === "admin" || role === "member";
  const isViewer = role === "viewer";


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
          <button className="p-2 rounded hover:bg-gray-100" title="Invite">
            <Link2 size={20} />
          </button>
          <button className="p-2 rounded hover:bg-gray-100" title="Settings">
            <MoreHorizontal size={20} />
          </button>
        </div>
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
