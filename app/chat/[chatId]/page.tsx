"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSession, useUser } from "@clerk/nextjs";
import createClerkSupabaseClient from "@/lib/supabaseClient";
// import ChatRoom from "./ChatRoom";
import ChatRoomFinal from "./ChatRoomFinal";

export default function ChatDetailsPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { user } = useUser();
  const { session } = useSession();

  const client = useMemo(() => createClerkSupabaseClient(session), [session]);

  const [chat, setChat] = useState<{
    id: string;
    title: string;
    workspace_id: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !chatId) return;
    setLoading(true);
    setError("");
    const fetchChat = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await client
        .from("chats")
        .select("id, title, workspace_id, created_by, created_at, updated_at")
        .eq("id", chatId)
        .single();
      if (error) setError(error.message);
      else setChat(data);
      setLoading(false);
    };
    fetchChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, chatId]);

  if (loading) return <div className="p-8">Loading chat...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!chat) return <div className="p-8 text-gray-500">Chat not found.</div>;

  return <ChatRoomFinal client={client} />;
}
