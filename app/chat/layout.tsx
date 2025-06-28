"use client";
import React, { useEffect, useState } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const chatId = params?.chatId as string | undefined;
  const { user } = useUser();
  const { session } = useSession();
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null | undefined>(
    undefined
  );
  const [workspaceName, setWorkspaceName] = useState<string>("");

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

  // Fetch current chat's workspaceId and workspaceName
  useEffect(() => {
    // Fetch workspace name immediately on mount
    const fetchWorkspaceName = async () => {
      if (!chatId) return;
      try {
        const { data: chatData } = await client
          .from("chats")
          .select("workspace_id")
          .eq("id", chatId)
          .single();

        if (chatData?.workspace_id) {
          const { data: ws } = await client
            .from("workspaces")
            .select("name")
            .eq("id", chatData.workspace_id)
            .single();

          // Set both workspaceId and name in a single update to avoid flickering
          setWorkspaceId(chatData.workspace_id);
          setWorkspaceName(ws?.name || "");
        } else {
          setWorkspaceId(null);
          setWorkspaceName("");
        }
      } catch (error) {
        console.error("Error fetching workspace name:", error);
        setWorkspaceName("");
      }
    };

    fetchWorkspaceName();
  }, [chatId, client]);

  // Fetch chat rooms for sidebar
  useEffect(() => {
    if (!user?.id || workspaceId === undefined) return;
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
    };
    fetchChats();
  }, [user?.id, workspaceId]);

  return (
    <div className="flex h-[90vh] max-w-9xl mx-auto border rounded shadow bg-white overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50 flex flex-col overflow-x-hidden">
        <div className="p-4 border-b flex items-center gap-2 text-sm font-medium">
          <span
            className="truncate font-semibold"
            title={workspaceName || undefined}
          >
            {workspaceId ? workspaceName || "Workspace" : "All chats"}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {chatRooms.map((room) => (
              <li
                key={room.id}
                className={clsx(
                  "flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer",
                  room.id === chatId && "bg-blue-100 font-semibold"
                )}
              >
                <span
                  className={clsx(
                    "inline-block w-2 h-2 rounded-full",
                    room.id === chatId ? "bg-green-500" : "bg-gray-300"
                  )}
                />
                <Link href={`/chat/${room.id}`} className="flex-1 truncate">
                  {room.title}
                </Link>
              </li>
            ))}
            {chatRooms.length === 0 && (
              <li className="text-gray-400 px-2 py-2">No chats</li>
            )}
          </ul>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
