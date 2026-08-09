import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuthStore } from '@/lib/auth-store';
import { getToken } from '@/lib/api-client';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: any;
  }
}

/**
 * Determines whether the Reverb WebSocket server is reachable.
 * Returns false on Vercel preview/production domains when no explicit
 * NEXT_PUBLIC_REVERB_HOST has been set – this prevents hundreds of
 * failed WebSocket connection attempts that flood the console.
 */
function isReverbAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  const explicitHost = process.env.NEXT_PUBLIC_REVERB_HOST;
  if (explicitHost) return true; // Explicitly configured → always try

  // On Vercel domains the Reverb server is never co-located
  const hostname = window.location.hostname;
  if (
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.vercel.sh')
  ) {
    return false;
  }

  // localhost / custom domain → assume Reverb is running locally
  return true;
}

export function useReverb() {
  const { user, token } = useAuthStore();
  const [echoInstance, setEchoInstance] = useState<any>(null);

  useEffect(() => {
    // Only connect if we have a logged in user, token, AND Reverb is reachable
    if (!user || !token || !isReverbAvailable()) {
      if (typeof window !== 'undefined' && window.Echo) {
        window.Echo.disconnect();
      }
      setEchoInstance(null);
      return;
    }

    window.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'g4k_reverb_key',
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || window.location.hostname,
      wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
      wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: '/api/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          Accept: 'application/json',
        },
      },
    });

    window.Echo = echo;
    setEchoInstance(echo);

    return () => {
      echo.disconnect();
    };
  }, [user?.id, token]); // Reconnect if user changes

  const subscribe = (channelName: string, isPrivate: boolean = false) => {
    if (!echoInstance) return null;
    return isPrivate ? echoInstance.private(channelName) : echoInstance.channel(channelName);
  };

  return { subscribe, isConnected: !!echoInstance, echo: echoInstance };
}
