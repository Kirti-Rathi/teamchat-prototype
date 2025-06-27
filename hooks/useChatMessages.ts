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
      .select("*", { count: "exact" })
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data);
        setLoading(false);
      });
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    // Create a new channel for real-time updates
    const channel = client
      .channel(`messages:chat:${chatId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        console.log("Received real-time update:", payload);
        setMessages(prev => [...prev, payload.new as Message]);
      })
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
    };
  }, [chatId]);

  // Scroll to bottom on new message with debouncing
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages]);

  return { messages, setMessages, loading, messagesEndRef };
}
