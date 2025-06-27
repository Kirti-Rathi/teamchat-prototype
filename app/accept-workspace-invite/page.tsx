"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AcceptWorkspaceInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Accepting invite...');

  useEffect(() => {
    const acceptInvite = async () => {
      const inviteId = searchParams.get('invite');
      if (!inviteId) {
        setStatus('error');
        setMessage('No invite token provided.');
        return;
      }

      try {
        const res = await fetch('/api/accept-workspace-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ inviteId }),
        });

        const data = await res.json();
        if (!res.ok) throw data;

        if (data.alreadyAccepted) {
          setStatus('already');
          setMessage('You have already joined this workspace! Redirecting...');
          setTimeout(() => router.push(`/workspace/${data.workspaceId}`), 2000);
        } else {
          setStatus('success');
          setMessage('Invite accepted! Redirecting to workspace...');
          setTimeout(() => router.push(`/workspace/${data.workspaceId}`), 2000);
        }
      } catch (err: any) {
        console.error('Error accepting workspace invite:', err);
        setStatus('error');
        setMessage(err.error || err.message || 'Failed to accept invite');
      }
    };

    acceptInvite();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {status === 'loading' && (
        <>  
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-gray-600" />
          <p>{message}</p>
        </>
      )}

      {status === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>{message}</p>
        </div>
      )}

      {status === 'already' && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p>{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {message}</p>
        </div>
      )}
    </div>
  );
}
