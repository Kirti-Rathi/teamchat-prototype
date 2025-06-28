import { NextResponse } from "next/server";
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { inviteId, inviteeEmail, inviterName, chatTitle, role } =
      await request.json();

    if (!inviteId || !inviteeEmail || !inviterName || !chatTitle || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In a real app, you would use an email service like SendGrid, Resend, or Nodemailer
    // This is a placeholder for the actual email sending logic
    const acceptLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?invite=${inviteId}`;

    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Set this up in your Resend domain settings
      to: inviteeEmail,
      subject: `You've been invited to join "${chatTitle}"`,
      html: `
        <div>
          <h2>You've been invited to join ${chatTitle}</h2>
          <p><strong>${inviterName}</strong> has invited you to join the chat as a <strong>${role}</strong>.</p>
          <p>Click the button below to accept the invite:</p>
          <p><a href="${acceptLink}" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Accept Invite</a></p>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p>${acceptLink}</p>
        </div>
      `,
    });

    // For now, we'll just log the email that would be sent
    console.log("Sending invite email:", {
      to: inviteeEmail,
      subject: `You've been invited to join ${chatTitle}`,
      html: `
        <div>
          <h2>You've been invited to join ${chatTitle}</h2>
          <p>${inviterName} has invited you to join the chat "${chatTitle}" as a ${role}.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${acceptLink}">Accept Invitation</a>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${acceptLink}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending invite email:", error);
    return NextResponse.json(
      { error: "Failed to send invite email" },
      { status: 500 }
    );
  }
}
