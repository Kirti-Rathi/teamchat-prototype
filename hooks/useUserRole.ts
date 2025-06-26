import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Role } from "@/types/message";

export function useUserRole(chatId: string, userId: string | undefined, session: any) {
  const [role, setRole] = useState<Role | null>(null);

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
    if (!chatId || !userId) return;

    const fetchRole = async () => {
      const { data } = await client
        .from("chat_user_roles")
        .select("role")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .single();

      setRole(data?.role ?? null);
    };

    fetchRole();
  }, [chatId, userId]);

  return role;
}
