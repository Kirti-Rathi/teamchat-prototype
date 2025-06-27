import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { inviteId, inviteeEmail, inviterName, workspaceName, role } = await request.json();

    if (!inviteId || !inviteeEmail || !inviterName || !workspaceName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const acceptLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-workspace-invite?invite=${inviteId}`;

    console.log("Sending Workspace Invite", {from: 'onboarding@resend.dev',
        to: inviteeEmail,
        subject: `You've been invited to join the workspace "${workspaceName}"`,
        html: `
            <div>
            <h2>You've been invited to join ${workspaceName}</h2>
            <p><strong>${inviterName}</strong> has invited you as a <strong>${role}</strong>.</p>
            <p><a href="${acceptLink}" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 5px;">Accept Invite</a></p>
            <p>If the button doesn't work, paste this link: ${acceptLink}</p>
            </div>
    `})

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: inviteeEmail,
      subject: `You've been invited to join the workspace "${workspaceName}"`,
      html: `
        <div>
          <h2>You've been invited to join ${workspaceName}</h2>
          <p><strong>${inviterName}</strong> has invited you as a <strong>${role}</strong>.</p>
          <p><a href="${acceptLink}" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 5px;">Accept Invite</a></p>
          <p>If the button doesn't work, paste this link: ${acceptLink}</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending workspace invite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
