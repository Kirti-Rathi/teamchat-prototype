"use client";

import React, { useEffect, useState } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams } from "next/navigation";

const Workspace = () => {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [chats, setChats] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useUser();
  const { session } = useSession();

  function createClerkSupabaseClient() {
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

  const client = createClerkSupabaseClient();

  // useEffect(() => {
  //   const fetchChats = async () => {
  //     setLoading(true);
  //     setError("");
  //     const supabase = createClient();
  //     const { data, error } = await supabase
  //       .from("chats")
  //       .select("id, title")
  //       .eq("workspace_id", workspaceId);
  //     if (error) setError("Failed to fetch chats: " + error.message);
  //     setChats(data || []);
  //     setLoading(false);
  //   };
  //   if (workspaceId) fetchChats();
  // }, [workspaceId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    async function loadChats() {
      // Fetch chats: only standalone chats (workspace_id is null) where user is a member
      const { data, error } = await client
        .from("chats")
        .select("id, title")
        .eq("workspace_id", workspaceId);

      if (error) setError("Failed to fetch chats: " + error.message);
      else setChats(data || []);
      setLoading(false);
    }
    if (workspaceId) loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // const handleCreateChat = async () => {
  //   const title = prompt("Enter chat title:");
  //   if (!title) return;
  //   setLoading(true);
  //   setError("");
  //   setSuccess("");
  //   try {
  //     const supabase = createClient();
  //     // 1. Create chat in this workspace
  //     const { data: chat, error: chatError } = await supabase
  //       .from("chats")
  //       .insert({ title, workspace_id: workspaceId })
  //       .select()
  //       .single();
  //     if (chatError) throw chatError;
  //     setSuccess("Chat created!");
  //     setChats((prev) => [...prev, { id: chat.id, title: chat.title }]);
  //   } catch (e) {
  //     setError((e as Error).message || "Failed to create chat");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  async function handleCreateChat() {
    setError("");
    setSuccess("");
    if (!user?.id) {
      setError("User not found. Please sign in.");
      return;
    }
    const title = prompt("Enter chat title:");
    if (!title || !title.trim()) return;
    setLoading(true);
    // Insert chat, set created_by to user.id and workspace_id to null (standalone)
    const { data, error: chatError } = await client
      .from("chats")
      .insert({ title, created_by: user.id, workspace_id: workspaceId })
      .select()
      .single();
    if (chatError) {
      setError(chatError.message);
      setLoading(false);
      return;
    }
    // Assign admin role to user in chat_user_roles
    const { error: roleError } = await client
      .from("chat_user_roles")
      .insert({ chat_id: data.id, user_id: user.id, role: "admin" });
    if (roleError) {
      setError(roleError.message);
      setLoading(false);
      return;
    }
    setSuccess("Chat created!");
    setChats((prev) => [...prev, { id: data.id, title: data.title }]);
    setLoading(false);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Workspace Chats</h1>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-6"
        onClick={handleCreateChat}
        disabled={loading}
      >
        + New Chat
      </button>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? (
        <div>Loading chats...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {chats.length === 0 && (
            <div className="text-gray-400 col-span-full">
              No chats in this workspace
            </div>
          )}
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="block p-6 bg-white rounded shadow hover:bg-blue-50 border border-gray-200 transition"
            >
              <div className="font-bold text-lg mb-2">{chat.title}</div>
              <div className="text-xs text-gray-500">ID: {chat.id}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workspace;
