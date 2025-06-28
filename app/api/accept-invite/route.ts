import { auth, getAuth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function createServerSupabaseClient(req: NextRequest) {
  const { getToken } = getAuth(req);

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        async getToken() {
          const token = await getToken({ template: "supabase" });
          return token || null;
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  // console.log('=== New Request ===');
  // console.log('Request URL:', request.url);

  // Log all headers for debugging
  // const headers = Object.fromEntries(request.headers.entries());
  // console.log('Request Headers:', JSON.stringify(headers, null, 2));

  const supabase = createServerSupabaseClient(request);

  try {
    const body = await request.json();
    console.log("Request Body:", body);

    const { inviteId } = body;

    if (!inviteId) {
      console.error("No inviteId provided in request");
      return NextResponse.json(
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    // Get the current user from Clerk
    // console.log('Getting auth...');
    const authResult = await auth(request);
    // console.log('Auth result:', JSON.stringify(authResult, null, 2));

    const { userId } = authResult;

    if (!userId) {
      console.error("No user ID found in session. Auth result:", authResult);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Authenticated user ID:", userId);

    // Get user details from Clerk
    const userUrl = new URL(`/v1/users/${userId}`, "https://api.clerk.dev");
    const user = await fetch(userUrl.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    const userEmail = user?.email_addresses?.find(
      (email: any) => email.id === user.primary_email_address_id
    )?.email_address;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from("chat_invites")
      .select("*")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if the email matches
    if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "This invite is not for your email" },
        { status: 403 }
      );
    }

    // Check if already accepted
    if (invite.accepted) {
      // return NextResponse.json(
      //   { error: 'This invite has already been accepted' },
      //   { status: 400 }
      // );
      return NextResponse.json(
        {
          alreadyAccepted: true,
          chatId: invite.chat_id,
          message: "Invite already accepted",
        },
        { status: 200 }
      );
    }

    // Update the invite to mark it as accepted
    const { data: updatedInvite, error: updateError } = await supabase
      .from("chat_invites")
      .update({ accepted: true })
      .eq("id", inviteId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add user to chat_user_roles
    const { error: roleError } = await supabase.from("chat_user_roles").upsert(
      {
        user_id: userId, // Using Clerk's user ID
        chat_id: invite.chat_id,
        role: invite.role as "admin" | "member" | "guest" | "viewer",
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,chat_id",
      }
    );

    if (roleError) throw roleError;

    return NextResponse.json({ success: true, chatId: invite.chat_id });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}
