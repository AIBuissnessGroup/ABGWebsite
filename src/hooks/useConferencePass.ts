'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ConferenceTicket } from '@/types/conference-ticket';

export type ConferencePassState =
  | { status: 'loading'; ticket: null }
  | { status: 'signed-out'; ticket: null }
  | { status: 'none'; ticket: null }
  | { status: 'has-pass'; ticket: ConferenceTicket };

// Looks up the signed-in user's conference pass (matched by their Google login email)
export function useConferencePass(): ConferencePassState {
  const { data: session, status: sessionStatus } = useSession();
  const email = session?.user?.email;
  const [state, setState] = useState<ConferencePassState>({ status: 'loading', ticket: null });

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!email) {
      setState({ status: 'signed-out', ticket: null });
      return;
    }

    let cancelled = false;
    fetch('/api/conference/tickets/my-pass')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setState(data.hasTicket && data.ticket ? { status: 'has-pass', ticket: data.ticket } : { status: 'none', ticket: null });
      })
      .catch((e) => {
        console.error('Error checking existing pass:', e);
        if (!cancelled) setState({ status: 'none', ticket: null });
      });
    return () => {
      cancelled = true;
    };
  }, [email, sessionStatus]);

  return state;
}
