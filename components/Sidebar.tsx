"use client";
import React, { useEffect, useState } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import clsx from "clsx";

interface SidebarProps {
  workspaceId?: string | null;
  activeChatId?: string;
  onNewChat?: () => void;
}

export default function Sidebar({
  workspaceId,
  activeChatId,
  onNewChat,
}: SidebarProps) {
  const { user } = useUser();
  const { session } = useSession();
  const [chatRooms, setChatRooms] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!user?.id || workspaceId === undefined) return;
    setLoading(true);
    const fetchChats = async () => {
      const { data: userChatRoles } = await client
        .from("chat_user_roles")
        .select("chat_id")
        .eq("user_id", user.id);
      const userChatIds = (userChatRoles || []).map(
        (r: { chat_id: string }) => r.chat_id
      );
      let query = client
        .from("chats")
        .select("id, title, workspace_id")
        .order("created_at", { ascending: true });
      if (workspaceId === null) {
        query = query.is("workspace_id", null).in("id", userChatIds);
      } else {
        query = query.eq("workspace_id", workspaceId).in("id", userChatIds);
      }
      const { data: chats } = await query;
      setChatRooms(chats || []);
      setLoading(false);
    };
    fetchChats();
  }, [user?.id, workspaceId]);

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col border-r">
      <button
        className="m-4 mb-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
        onClick={onNewChat}
        disabled={loading}
      >
        + New Chat
      </button>
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {loading && <li className="text-gray-400 px-2 py-2">Loading...</li>}
          {chatRooms.length === 0 && !loading && (
            <li className="text-gray-400 px-2 py-2">No chats</li>
          )}
          {chatRooms.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/chat/${chat.id}`}
                className={clsx(
                  "block px-3 py-2 rounded hover:bg-gray-800 transition cursor-pointer truncate",
                  chat.id === activeChatId && "bg-blue-800 font-semibold"
                )}
              >
                {chat.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
