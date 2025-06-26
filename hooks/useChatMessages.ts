import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Message } from "@/types/message";

export function useChatMessages(chatId: string, session: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return session?.getToken() ?? null;
      },
    }
  );

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    client
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
        setLoading(false);
      });
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const channel = client
      .channel(`messages:chat:${chatId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  return { messages, setMessages, loading, messagesEndRef };
}
