// "use client";
// import React, { useEffect, useState } from "react";
// import { useSession, useUser } from "@clerk/nextjs";
// import { createClient } from "@supabase/supabase-js";
// import Link from "next/link";

// export default function Dashboard() {
//   const [workspaces, setWorkspaces] = useState<
//     Array<{ id: string; name: string }>
//   >([]);
//   const [chats, setChats] = useState<Array<{ id: string; title: string }>>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const { user } = useUser();
//   const { session } = useSession();

//   function createClerkSupabaseClient() {
//     return createClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//       {
//         async accessToken() {
//           return session?.getToken() ?? null;
//         },
//       }
//     );
//   }

//   const client = createClerkSupabaseClient();

//   useEffect(() => {
//     if (!user) return;
//     setLoading(true);
//     setError("");
//     async function loadWorkspacesAndChats() {
//       // Fetch workspaces
//       const { data: wsData, error: wsError } = await client
//         .from("workspaces")
//         .select("id, name");
//       if (wsError) setError(wsError.message);
//       else setWorkspaces(wsData || []);
//       // Fetch chats: only standalone chats (workspace_id is null) where user is a member
//       const { data: chatData, error: chatError } = await client
//         .from("chats")
//         .select("id, title")
//         .is("workspace_id", null)
//         .in(
//           "id",
//           (
//             await client
//               .from("chat_user_roles")
//               .select("chat_id")
//               .eq("user_id", user.id)
//           ).data?.map((r: any) => r.chat_id) || []
//         );
//       if (chatError) setError(chatError.message);
//       else setChats(chatData || []);
//       setLoading(false);
//     }
//     loadWorkspacesAndChats();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user]);

//   async function handleCreateWorkspace() {
//     setError("");
//     setSuccess("");
//     if (!user?.id) {
//       setError("User not found. Please sign in.");
//       return;
//     }
//     const name = prompt("Enter workspace name:");
//     if (!name || !name.trim()) return;
//     setLoading(true);
//     // Insert workspace, set created_by to user.id
//     const { data, error: wsError } = await client
//       .from("workspaces")
//       .insert({ name, created_by: user.id })
//       .select()
//       .single();
//     if (wsError) {
//       setError(wsError.message);
//       setLoading(false);
//       return;
//     }
//     // Assign admin role to user in workspace_user_roles
//     const { error: roleError } = await client
//       .from("workspace_user_roles")
//       .insert({ workspace_id: data.id, user_id: user.id, role: "admin" });
//     if (roleError) {
//       setError(roleError.message);
//       setLoading(false);
//       return;
//     }
//     setSuccess("Workspace created!");
//     setWorkspaces((prev) => [...prev, { id: data.id, name: data.name }]);
//     setLoading(false);
//   }

//   async function handleCreateChat() {
//     setError("");
//     setSuccess("");
//     if (!user?.id) {
//       setError("User not found. Please sign in.");
//       return;
//     }
//     const title = prompt("Enter chat title:");
//     if (!title || !title.trim()) return;
//     setLoading(true);
//     // Insert chat, set created_by to user.id and workspace_id to null (standalone)
//     const { data, error: chatError } = await client
//       .from("chats")
//       .insert({ title, created_by: user.id, workspace_id: null })
//       .select()
//       .single();
//     if (chatError) {
//       setError(chatError.message);
//       setLoading(false);
//       return;
//     }
//     // Assign admin role to user in chat_user_roles
//     const { error: roleError } = await client
//       .from("chat_user_roles")
//       .insert({ chat_id: data.id, user_id: user.id, role: "admin" });
//     if (roleError) {
//       setError(roleError.message);
//       setLoading(false);
//       return;
//     }
//     setSuccess("Chat created!");
//     setChats((prev) => [...prev, { id: data.id, title: data.title }]);
//     setLoading(false);
//   }

//   if (!user) {
//     return (
//       <div className="p-8 text-red-500">No user found. Please sign in.</div>
//     );
//   }

//   return (
//     <div className="flex min-h-screen">
//       {/* Left panel: Chats */}
//       <aside className="w-64 bg-gray-900 text-white flex flex-col border-r">
//         <button
//           className="m-4 mb-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
//           onClick={handleCreateChat}
//           disabled={loading}
//         >
//           + New Chat
//         </button>
//         <div className="flex-1 overflow-y-auto">
//           <ul className="space-y-1 px-2">
//             {chats.length === 0 && (
//               <li className="text-gray-400 px-2 py-2">No chats</li>
//             )}
//             {chats.map((chat) => (
//               <li key={chat.id}>
//                 <Link
//                   href={`/chat/${chat.id}`}
//                   className="block px-3 py-2 rounded hover:bg-gray-800 transition cursor-pointer truncate"
//                 >
//                   {chat.title}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </div>
//       </aside>
//       {/* Main content: Workspaces grid */}
//       <main className="flex-1 p-8">
//         <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
//         <button
//           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-8"
//           onClick={handleCreateWorkspace}
//           disabled={loading}
//         >
//           {loading ? "Creating..." : "Create Workspace"}
//         </button>
//         {error && <div className="text-red-500 mt-2">{error}</div>}
//         {success && <div className="text-green-600 mt-2">{success}</div>}
//         <h3 className="text-xl font-semibold mt-8 mb-4">Your Workspaces</h3>
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//           {workspaces.length === 0 && (
//             <div className="text-gray-400 col-span-full">No workspaces</div>
//           )}
//           {workspaces.map((ws) => (
//             <Link
//               key={ws.id}
//               href={`/workspace/${ws.id}`}
//               className="block p-6 bg-white rounded shadow hover:bg-blue-50 border border-gray-200 transition"
//             >
//               <div className="font-bold text-lg mb-2">{ws.name}</div>
//               <div className="text-xs text-gray-500">ID: {ws.id}</div>
//             </Link>
//           ))}
//         </div>
//       </main>
//     </div>
//   );
// }

// "use client";
// import React, { useEffect, useState } from "react";
// import { useSession, useUser } from "@clerk/nextjs";
// import { createClient } from "@supabase/supabase-js";
// import Link from "next/link";

// export default function Dashboard() {
//   const [workspaces, setWorkspaces] = useState<
//     Array<{ id: string; name: string }>
//   >([]);
//   const [chats, setChats] = useState<Array<{ id: string; title: string }>>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // const { user } = useUser();
//   const { user, isLoaded } = useUser();
//   const { session } = useSession();

//   function createClerkSupabaseClient() {
//     return createClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//       {
//         async accessToken() {
//           return session?.getToken() ?? null;
//         },
//       }
//     );
//   }

//   const client = createClerkSupabaseClient();

//   useEffect(() => {
//     if (!user) return;

//     setLoading(true);
//     setError("");

//     async function loadData() {
//       try {
//         const [wsResp, roleResp] = await Promise.all([
//           client.from("workspaces").select("id, name"),
//           client
//             .from("chat_user_roles")
//             .select("chat_id")
//             .eq("user_id", user.id),
//         ]);

//         if (wsResp.error) throw new Error(wsResp.error.message);
//         setWorkspaces(wsResp.data || []);

//         if (roleResp.error) throw new Error(roleResp.error.message);
//         const chatIds = roleResp.data?.map((r: any) => r.chat_id) || [];

//         if (chatIds.length > 0) {
//           const { data: chatData, error: chatError } = await client
//             .from("chats")
//             .select("id, title")
//             .is("workspace_id", null)
//             .in("id", chatIds);

//           if (chatError) throw new Error(chatError.message);
//           setChats(chatData || []);
//         } else {
//           setChats([]);
//         }
//       } catch (err: any) {
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadData();
//   }, [user]);

//   async function handleCreateWorkspace() {
//     setError("");
//     setSuccess("");

//     if (!user?.id) {
//       setError("User not found. Please sign in.");
//       return;
//     }

//     const name = prompt("Enter workspace name:");
//     if (!name?.trim()) return;

//     setLoading(true);
//     try {
//       const { data, error: wsError } = await client
//         .from("workspaces")
//         .insert({ name, created_by: user.id })
//         .select()
//         .single();

//       if (wsError) throw new Error(wsError.message);

//       const { error: roleError } = await client
//         .from("workspace_user_roles")
//         .insert({ workspace_id: data.id, user_id: user.id, role: "admin" });

//       if (roleError) throw new Error(roleError.message);

//       setSuccess("Workspace created!");
//       setWorkspaces((prev) => [...prev, { id: data.id, name: data.name }]);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleCreateChat() {
//     setError("");
//     setSuccess("");

//     if (!user?.id) {
//       setError("User not found. Please sign in.");
//       return;
//     }

//     const title = prompt("Enter chat title:");
//     if (!title?.trim()) return;

//     setLoading(true);
//     try {
//       const { data, error: chatError } = await client
//         .from("chats")
//         .insert({ title, created_by: user.id, workspace_id: null })
//         .select()
//         .single();

//       if (chatError) throw new Error(chatError.message);

//       const { error: roleError } = await client
//         .from("chat_user_roles")
//         .insert({ chat_id: data.id, user_id: user.id, role: "admin" });

//       if (roleError) throw new Error(roleError.message);

//       setSuccess("Chat created!");
//       setChats((prev) => [...prev, { id: data.id, title: data.title }]);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   if (!isLoaded) {
//     return <div className="p-8 text-gray-500">Loading your dashboard...</div>; // or spinner
//   }

//   if (!user) {
//     return (
//       <div className="p-8 text-red-500">No user found. Please sign in.</div>
//     );
//   }

//   return (
//     <div className="flex min-h-screen">
//       {/* Left panel: Chats */}
//       <aside className="w-64 bg-gray-900 text-white flex flex-col border-r">
//         <button
//           className="m-4 mb-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
//           onClick={handleCreateChat}
//           disabled={loading}
//         >
//           + New Chat
//         </button>
//         <div className="flex-1 overflow-y-auto">
//           <ul className="space-y-1 px-2">
//             {chats.length === 0 && (
//               <li className="text-gray-400 px-2 py-2">No chats</li>
//             )}
//             {chats.map((chat) => (
//               <li key={chat.id}>
//                 <Link
//                   href={`/chat/${chat.id}`}
//                   className="block px-3 py-2 rounded hover:bg-gray-800 transition cursor-pointer truncate"
//                 >
//                   {chat.title}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </div>
//       </aside>

//       {/* Main content: Workspaces grid */}
//       <main className="flex-1 p-8">
//         <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

//         <button
//           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-8"
//           onClick={handleCreateWorkspace}
//           disabled={loading}
//         >
//           {loading ? "Creating..." : "Create Workspace"}
//         </button>

//         {error && <div className="text-red-500 mt-2">{error}</div>}
//         {success && <div className="text-green-600 mt-2">{success}</div>}

//         <h3 className="text-xl font-semibold mt-8 mb-4">Your Workspaces</h3>
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//           {workspaces.length === 0 && (
//             <div className="text-gray-400 col-span-full">No workspaces</div>
//           )}
//           {workspaces.map((ws) => (
//             <Link
//               key={ws.id}
//               href={`/workspace/${ws.id}`}
//               className="block p-6 bg-white rounded shadow hover:bg-blue-50 border border-gray-200 transition"
//             >
//               <div className="font-bold text-lg mb-2">{ws.name}</div>
//               <div className="text-xs text-gray-500">ID: {ws.id}</div>
//             </Link>
//           ))}
//         </div>
//       </main>
//     </div>
//   );
// }

"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "@clerk/nextjs";
import createClerkSupabaseClient from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import Sidebar from "@/components/dashboard/Sidebar";
import WorkspacesGrid from "@/components/dashboard/WorkspaceGrid";

// Types for our data models
type Workspace = { id: string; name: string };
type Chat = { id: string; title: string };

// Main dashboard component
export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [actionLoading, setActionLoading] = useState(false); // For user actions
  const [backgroundLoading, setBackgroundLoading] = useState(true); // For initial/real-time loads
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { user, isLoaded } = useUser();
  // if (user && isLoaded) {
  //   console.log("User:", user?.firstName, user?.lastName, user?.id);
  // } else {
  //   console.log("No user found or user not loaded yet");
  // }
  const { session } = useSession();

  const client = useMemo(() => createClerkSupabaseClient(session), [session]);

  useEffect(() => {
    console.log("Active channels:", client.getChannels().length);
  }, [client]);

  // const loadData = useCallback(async () => {
  //   if (!user) return;

  //   try {
  //     const supabase = client;

  //     const [wsResp, roleResp] = await Promise.all([
  //       supabase
  //         .from("workspaces")
  //         .select("id, name")
  //         .eq("created_by", user.id),
  //       supabase
  //         .from("chat_user_roles")
  //         .select("chat_id")
  //         .eq("user_id", user.id),
  //     ]);

  //     console.log("Workspace response:", wsResp);
  //     console.log("Role response:", roleResp);

  //     if (wsResp.error) throw new Error(wsResp.error.message);
  //     setWorkspaces(wsResp.data || []);

  //     if (roleResp.error) throw new Error(roleResp.error.message);
  //     const chatIds = roleResp.data?.map((r: any) => r.chat_id) || [];

  //     if (chatIds.length > 0) {
  //       const { data: chatData, error: chatError } = await supabase
  //         .from("chats")
  //         .select("id, title")
  //         .is("workspace_id", null)
  //         .in("id", chatIds);

  //       if (chatError) throw new Error(chatError.message);
  //       setChats(chatData || []);
  //     } else {
  //       setChats([]);
  //     }
  //   } catch (err: any) {
  //     setError(err.message);
  //   } finally {
  //     setBackgroundLoading(false);
  //   }
  // }, [user, client]);
  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = client;

      // Fetch workspaces where the user has any role
      const { data: workspaceRoles, error: workspaceError } = await supabase
        .from("workspace_user_roles")
        .select("workspace_id, workspaces(id, name)")
        .eq("user_id", user.id);

      if (workspaceError) throw new Error(workspaceError.message);

      const workspaceList =
        workspaceRoles?.map((w: any) => w.workspaces).filter(Boolean) || [];
      setWorkspaces(workspaceList);

      // Fetch chats where the user has any role
      const { data: chatRoles, error: chatRolesError } = await supabase
        .from("chat_user_roles")
        .select("chat_id, chats(id, title, workspace_id)")
        .eq("user_id", user.id);

      if (chatRolesError) throw new Error(chatRolesError.message);

      // Filter for standalone chats (workspace_id is null)
      const standaloneChats =
        chatRoles
          ?.map((c: any) => c.chats)
          .filter((chat: any) => chat?.workspace_id === null) || [];

      setChats(standaloneChats);

      console.log("Workspaces:", workspaceList);
      console.log("Standalone Chats:", standaloneChats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBackgroundLoading(false);
    }
  }, [user, client]);

  useEffect(() => {
    if (!user) return;

    // Initial data load
    loadData();

    // Real-time subscriptions
    const supabase = client;
    const workspaceSubscription = supabase
      .channel("workspace_changes")
      .on(
        "postgres_changes",
        {
          event: ["INSERT", "DELETE"],
          schema: "public",
          table: "workspaces",
        },
        () => {
          setBackgroundLoading(true);
          loadData();
        }
      )
      .subscribe();

    const chatSubscription = supabase
      .channel("chat_changes")
      .on(
        "postgres_changes",
        {
          event: ["INSERT", "DELETE"],
          schema: "public",
          table: "chats",
          filter: `workspace_id=is.null`,
        },
        () => {
          setBackgroundLoading(true);
          loadData();
        }
      )
      .subscribe();

    return () => {
      workspaceSubscription.unsubscribe();
      chatSubscription.unsubscribe();

      console.log(
        "Channels count after unsubscribe",
        supabase.getChannels().length
      );
    };
  }, [user, loadData, client]);

  async function handleCreateWorkspace() {
    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("User not found. Please sign in.");
      return;
    }

    const name = prompt("Enter workspace name:");
    if (!name?.trim()) return;

    setActionLoading(true);
    try {
      const { data, error: wsError } = await client
        .from("workspaces")
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (wsError) throw new Error(wsError.message);

      const { error: roleError } = await client
        .from("workspace_user_roles")
        .insert({ workspace_id: data.id, user_id: user.id, role: "admin" });

      if (roleError) throw new Error(roleError.message);

      setSuccess("Workspace created!");
      setTimeout(() => setSuccess(""), 3000); // Auto-clear after 3 seconds

      setWorkspaces((prev) => [...prev, { id: data.id, name: data.name }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateChat() {
    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("User not found. Please sign in.");
      return;
    }

    const title = prompt("Enter chat title:");
    if (!title?.trim()) return;

    setActionLoading(true);
    try {
      const { data, error: chatError } = await client
        .from("chats")
        .insert({ title, created_by: user.id, workspace_id: null })
        .select()
        .single();
      console.log("Creating chat with:", user?.id);
      console.log("Chat data:", data, "Chat error:", chatError);

      if (chatError) throw new Error(chatError.message);

      const { error: roleError } = await client
        .from("chat_user_roles")
        .insert({ chat_id: data.id, user_id: user.id, role: "admin" });

      if (roleError) throw new Error(roleError.message);

      setSuccess("Chat created!");
      setTimeout(() => setSuccess(""), 3000); // Auto-clear after 3 seconds
      setChats((prev) => [...prev, { id: data.id, title: data.title }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("User not found. Please sign in.");
      return;
    }

    const confirmDelete = confirm(
      "Are you sure you want to delete this workspace? All associated chats and data will be permanently removed."
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      const { error } = await client
        .from("workspaces")
        .delete()
        .eq("id", workspaceId);

      if (error) throw new Error(error.message);

      setSuccess("Workspace deleted successfully! Updating data...");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      // State will automatically update via realtime subscription
    } catch (err: any) {
      setError(err.message || "Failed to delete workspace");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteChat(chatId: string) {
    setError("");
    setSuccess("");

    if (!user?.id) {
      setError("User not found. Please sign in.");
      return;
    }

    const confirmDelete = confirm(
      "Are you sure you want to delete this chat? All messages and data will be permanently removed."
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      const { error } = await client.from("chats").delete().eq("id", chatId);

      if (error) throw new Error(error.message);

      setSuccess("Chat deleted successfully! Updating data...");
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      // State will automatically update via realtime subscription
    } catch (err: any) {
      setError(err.message || "Failed to delete chat");
    } finally {
      setActionLoading(false);
    }
  }

  if (!isLoaded) {
    return <div className="p-8 text-gray-500">Loading your dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-red-500">No user found. Please sign in.</div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        chats={chats}
        loading={actionLoading || backgroundLoading}
        onCreateChat={handleCreateChat}
        onDeleteChat={handleDeleteChat}
      />
      <WorkspacesGrid
        workspaces={workspaces}
        loading={actionLoading || backgroundLoading}
        error={error}
        success={success}
        onCreateWorkspace={handleCreateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />
    </div>
  );
}
