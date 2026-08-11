"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, createElement } from 'react';
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

interface ReverbContextType {
  subscribe: (channelName: string, isPrivate?: boolean) => any;
  leaveChannel: (channelName: string) => void;
  isConnected: boolean;
  echo: any;
}

const ReverbContext = createContext<ReverbContextType>({
  subscribe: () => null,
  leaveChannel: () => {},
  isConnected: false,
  echo: null,
});

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

export function ReverbProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [echoInstance, setEchoInstance] = useState<any>(null);
  
  // Track subscription counts to prevent one component from leaving a channel used by another
  const [subscriptions] = useState<Map<string, number>>(() => new Map());

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

  const subscribe = useCallback((channelName: string, isPrivate: boolean = false) => {
    if (!echoInstance) return null;
    
    const count = subscriptions.get(channelName) || 0;
    subscriptions.set(channelName, count + 1);
    
    return isPrivate ? echoInstance.private(channelName) : echoInstance.channel(channelName);
  }, [echoInstance, subscriptions]);

  const leaveChannel = useCallback((channelName: string) => {
    if (!echoInstance) return;
    
    const count = (subscriptions.get(channelName) || 0) - 1;
    if (count <= 0) {
      subscriptions.delete(channelName);
      echoInstance.leave(channelName);
    } else {
      subscriptions.set(channelName, count);
    }
  }, [echoInstance, subscriptions]);

  return createElement(
    ReverbContext.Provider,
    { value: { subscribe, leaveChannel, isConnected: !!echoInstance, echo: echoInstance } },
    children
  );
}

export function useReverb() {
  return useContext(ReverbContext);
}
