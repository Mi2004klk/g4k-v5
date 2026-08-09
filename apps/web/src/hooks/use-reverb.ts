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

export function useReverb() {
  const { user, token } = useAuthStore();
  const [echoInstance, setEchoInstance] = useState<any>(null);

  useEffect(() => {
    // Only connect if we have a logged in user and token
    if (!user || !token) {
      if (window.Echo) {
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
