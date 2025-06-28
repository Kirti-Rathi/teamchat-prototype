"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useParams } from "next/navigation";
import InviteModal from "@/components/chat/InviteModalNew";
import { UserPlus, Upload, FileText, Trash } from "lucide-react";

// a tiny fetcher that passes through Clerk tokens
async function fetcher(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error("Network error");
  return res.json();
}

const Workspace = () => {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [chats, setChats] = useState<Array<{ id: string; title: string }>>([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
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

  console.log("WorkspaceID at top level:", workspaceId);

  // 1️⃣ SWR hook to load workspace‐level contexts
  const {
    data: wsContexts,
    error: wsError,
    mutate: mutateWsContexts,
  } = useSWR(
    workspaceId ? `/api/workspace/${workspaceId}/contexts` : null,
    fetcher
  );

  useEffect(() => {
    if (!workspaceId || !session) return;

    async function fetchWorkspaceName() {
      const { data, error } = await client
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single();

      console.log("workspaceId passed to fetch:", workspaceId);

      if (error) {
        console.error("Failed to fetch workspace name:", error.message);
        setWorkspaceName("Unnamed Workspace");
      } else {
        setWorkspaceName(data.name);
      }
    }

    fetchWorkspaceName();
  }, [workspaceId, session]);

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

  const handleSendWorkspaceInvites = async (
    invites: { email: string; role: string }[]
  ) => {
    try {
      const { data: insertedInvites, error } = await client
        .from("workspace_invites")
        .insert(
          invites.map((invite) => ({
            workspace_id: workspaceId, // Make sure this is in scope
            email: invite.email,
            role: invite.role,
            invited_by: user?.id || null,
          }))
        )
        .select();

      if (error) throw error;

      const emailPromises = invites.map(async (invite, index) => {
        try {
          const response = await fetch("/api/send-workspace-invite", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inviteId: insertedInvites?.[index]?.id,
              inviteeEmail: invite.email,
              inviterName: user?.fullName || user?.username || "Someone",
              workspaceName: workspaceName || "a workspace",
              role: invite.role,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("Failed to send workspace invite email:", error);
          }
        } catch (err) {
          console.error("Error sending workspace invite email:", err);
        }
      });

      await Promise.all(emailPromises);

      return { success: true };
    } catch (err) {
      console.error("Error sending workspace invites:", err);
      return { success: false, error: err };
    }
  };

  // 2️⃣ Handle file selection
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 2a. upload to Supabase Storage
    const path = `ws_${workspaceId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadErr } = await client.storage
      .from("contexts")
      .upload(path, file);

    // console.log("Upload data:", uploadData);

    if (uploadErr) {
      console.error("Upload error:", uploadErr.message);
      return;
    }

    const { data: urlData } = client.storage
      .from("contexts")
      .getPublicUrl(uploadData.path);

    // now grab the string out
    const publicUrl = urlData.publicUrl;

    // console.log("Public URL:", publicUrl);

    // 2b. insert metadata row
    const { error: dbErr } = await client.from("workspace_contexts").insert({
      workspace_id: workspaceId,
      uploaded_by: user.id,
      file_name: file.name,
      storage_path: uploadData.path,
      public_url: publicUrl,
    });

    if (dbErr) {
      console.error("DB insert error:", dbErr.message);
      return;
    }

    // 3️⃣ re‑fetch contexts list so sidebar updates
    mutateWsContexts();
  }

  console.log("SWR:", {
    key: workspaceId ? `/api/workspace/${workspaceId}/contexts` : null,
    wsContexts,
    wsError,
  });

  // 3️⃣ Remove a context file
  async function handleRemoveContext(id: string, storagePath: string) {
    // Confirm with the user
    if (!window.confirm("Are you sure you want to delete this context file?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    // 1. Delete metadata row from workspace_contexts
    const { error: dbErr } = await client
      .from("workspace_contexts")
      .delete()
      .eq("id", id);

    if (dbErr) {
      console.error("DB delete error:", dbErr.message);
      setError("Failed to delete context metadata.");
      setLoading(false);
      return;
    }

    // 2. Delete the actual file from Supabase Storage
    const { error: storageErr } = await client.storage
      .from("contexts")
      .remove([storagePath]);

    if (storageErr) {
      console.error("Storage delete error:", storageErr.message);
      // Not fatal — metadata is gone, but file might linger.
      setError("Metadata deleted, but failed to remove the file.");
    } else {
      setSuccess("Context file removed successfully.");
    }

    // 3. Refresh the list
    await mutateWsContexts();
    setLoading(false);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{workspaceName}</h1>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-6"
        onClick={handleCreateChat}
        disabled={loading}
      >
        + New Chat
      </button>
      <button
        className="p-2 rounded hover:bg-gray-100"
        title="Invite"
        onClick={() => setIsInviteModalOpen(true)}
      >
        <UserPlus size={20} />
      </button>
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSend={handleSendWorkspaceInvites}
      />
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
      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          📁 Workspace Context Files
        </h2>

        {/* File Upload */}
        <label
          htmlFor="file-upload"
          className="flex items-center gap-2 cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md w-fit hover:bg-blue-700 transition"
        >
          <Upload className="w-4 h-4" />
          Upload File
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Context List */}
        {wsError && <p className="text-red-500">⚠️ Failed to load contexts</p>}

        {!wsContexts ? (
          <p className="text-gray-600">⏳ Loading contexts…</p>
        ) : wsContexts.length === 0 ? (
          <p className="text-gray-400 italic">No context files uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wsContexts.map((ctx: any) => (
              <div
                key={ctx.id}
                className="relative border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition"
              >
                <a
                  href={ctx.public_url}
                  target="_blank"
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <FileText className="w-5 h-5 mr-2 text-blue-500" />
                  {ctx.file_name}
                </a>
                <button
                  onClick={() => handleRemoveContext(ctx.id, ctx.storage_path)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition"
                  aria-label="Remove context file"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Workspace;
