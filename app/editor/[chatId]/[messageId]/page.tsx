"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Room } from "./Room";
// import { Editor } from "./Editor";
import { TextEditor } from "../../components/TextEditor";
import createClerkSupabaseClient from "@/lib/supabaseClient";
import { useSession } from "@clerk/nextjs";

export default function Page() {
  const { messageId } = useParams();
  const { session } = useSession();
  const client = useMemo(() => createClerkSupabaseClient(session), [session]);
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    client
      .from("messages")
      .select("content")
      .eq("id", messageId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setContent(data.content);
        }
      });
  }, [messageId, client]);

  if (content === null) {
    return <div className="p-4 text-gray-500">Loading…</div>;
  }

  return (
    <Room messageId={messageId as string}>
      {/* <Editor content={content} /> */}
      {/* <TextEditor content={content} /> */}
      <TextEditor content={content} />
    </Room>
  );
}
