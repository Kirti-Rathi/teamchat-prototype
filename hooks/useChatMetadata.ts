import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export function useChatMetadata(chatId: string, session: any) {
  const [chatTitle, setChatTitle] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [adminInfo, setAdminInfo] = useState<{ email?: string; username?: string } | null>(null);

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

    const fetchMetadata = async () => {
      const { data: chatData } = await client
        .from("chats")
        .select("title, created_by, workspace_id")
        .eq("id", chatId)
        .single();

      if (chatData) {
        setChatTitle(chatData.title);

        if (chatData.created_by) {
          const { data: adminUser } = await client
            .from("users")
            .select("email, username")
            .eq("id", chatData.created_by)
            .single();
          setAdminInfo(adminUser);
        }

        if (chatData.workspace_id) {
          const { data: ws } = await client
            .from("workspaces")
            .select("name")
            .eq("id", chatData.workspace_id)
            .single();
          setWorkspaceName(ws?.name || "Workspace");
        }
      }
    };

    fetchMetadata();
  }, [chatId]);

  return { chatTitle, workspaceName, adminInfo };
}
