import { auth, getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function createServerSupabaseClient(req: NextRequest) {
  const { getToken } = getAuth(req);

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: false,
        async getToken() {
          const token = await getToken({ template: 'supabase' });
          return token || null;
        }
      }
    }
  );
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);

  try {
    const { inviteId } = await request.json();
    const { userId } = await auth(request);

    if (!inviteId || !userId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const userUrl = new URL(`/v1/users/${userId}`, 'https://api.clerk.dev');
    const user = await fetch(userUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }).then(res => res.json());

    const userEmail = user?.email_addresses?.find(
      (email: any) => email.id === user.primary_email_address_id
    )?.email_address;

    const { data: invite, error: inviteError } = await supabase
      .from('workspace_invites')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 });

    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Invite email mismatch' }, { status: 403 });
    }

    if (invite.accepted) {
      return NextResponse.json({ alreadyAccepted: true, workspaceId: invite.workspace_id });
    }

    await supabase
      .from('workspace_invites')
      .update({ accepted: true })
      .eq('id', inviteId);

    // Assign workspace role
    await supabase
      .from('workspace_user_roles')
      .upsert({
        user_id: userId,
        workspace_id: invite.workspace_id,
        role: invite.role,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,workspace_id'
      });

    // Fetch all chats in that workspace
    const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select("id")
    .eq("workspace_id", invite.workspace_id);

    if (chatsError) {
    console.error("Failed to fetch workspace chats:", chatsError.message);
    return NextResponse.json({ error: "Failed to assign chat permissions" }, { status: 500 });
    }

    // Map workspace role to chat role
    const workspaceToChatRole = {
    viewer: "viewer",
    guest: "guest",
    member: "member",
    };

    // Type-check the role before mapping
    if (!["viewer", "guest", "member"].includes(invite.role)) {
      return NextResponse.json({ error: "Invalid role mapping" }, { status: 400 });
    }

    const chatRole = workspaceToChatRole[invite.role as keyof typeof workspaceToChatRole];
    if (!chatRole) {
    return NextResponse.json({ error: "Invalid role mapping" }, { status: 400 });
    }

    // Prepare batch insert for chat_user_roles
    const chatUserRoles = chats.map(chat => ({
    chat_id: chat.id,
    user_id: userId,
    role: chatRole,
    created_at: new Date().toISOString(),
    }));

    // Upsert into chat_user_roles for each chat
    const { error: chatInsertError } = await supabase
    .from("chat_user_roles")
    .upsert(chatUserRoles, { onConflict: "chat_id,user_id" });

    if (chatInsertError) {
    console.error("Failed to assign chat roles:", chatInsertError.message);
    return NextResponse.json({ error: "Failed to assign chat permissions" }, { status: 500 });
    }


    return NextResponse.json({ success: true, workspaceId: invite.workspace_id });

  } catch (err) {
    console.error('Error accepting workspace invite:', err);
    return NextResponse.json({ error: 'Failed to accept workspace invite' }, { status: 500 });
  }
}
