"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, createElement } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuthStore } from '@/lib/auth-store';
import { getToken } from '@/lib/api-client';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: unknown;
  }
}

interface ReverbContextType {
  subscribe: (channelName: string, isPrivate?: boolean) => ReturnType<Echo<'reverb'>['channel']> | null;
  leaveChannel: (channelName: string) => void;
  isConnected: boolean;
  echo: Echo<'reverb'> | null;
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
  return !!process.env.NEXT_PUBLIC_REVERB_HOST && !!process.env.NEXT_PUBLIC_REVERB_APP_KEY; // Only connect if explicitly configured
}

export function ReverbProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [echoInstance, setEchoInstance] = useState<Echo<'reverb'> | null>(null);
  // Real pusher socket state — NOT mere Echo-instance existence. Drives the
  // polling fallbacks in consumers (chat/notifications) when the socket drops.
  const [socketConnected, setSocketConnected] = useState(false);

  // Track subscription counts to prevent one component from leaving a channel used by another
  const [subscriptions] = useState<Map<string, number>>(() => new Map());

  useEffect(() => {
    // Only connect if we have a logged in user, token, AND Reverb is reachable
    if (!user || !token || !isReverbAvailable()) {
      if (typeof window !== 'undefined' && window.Echo) {
        (window.Echo as Echo<'reverb'>).disconnect();
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEchoInstance(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocketConnected(false);
      return;
    }

    window.Pusher = Pusher;

    const echo = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || '',
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || undefined,
      wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT, 10) : 80,
      wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT, 10) : 443,
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || '/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          Accept: 'application/json',
        },
      },
    });

    window.Echo = echo;
    setEchoInstance(echo);

    // actual connection, not just the Echo instance existing.
    const pusherInstance = ((echo.connector as unknown) as { pusher: { connection: Pusher['connection'], connect: () => void } })?.pusher;
    const connection = pusherInstance?.connection;
    const handleConnected = () => setSocketConnected(true);
    const handleDisconnected = () => setSocketConnected(false);
    if (connection) {
      // Seed from the current state in case the socket already settled
      setSocketConnected(connection.state === 'connected');
      connection.bind('connected', handleConnected);
      connection.bind('disconnected', handleDisconnected);
      connection.bind('unavailable', handleDisconnected);
      connection.bind('failed', handleDisconnected);
    }

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible' && connection && connection.state !== 'connected') {
        pusherInstance?.connect();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrOnline);
    window.addEventListener('online', handleVisibilityOrOnline);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      window.removeEventListener('online', handleVisibilityOrOnline);
      if (connection) {
        connection.unbind('connected', handleConnected);
        connection.unbind('disconnected', handleDisconnected);
        connection.unbind('unavailable', handleDisconnected);
        connection.unbind('failed', handleDisconnected);
      }
      setSocketConnected(false);
      echo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]); // Reconnect if user changes

  const subscribe = useCallback((channelName: string, isPrivate: boolean = false) => {
    if (!echoInstance) return null;
    
    const count = subscriptions.get(channelName) || 0;
    subscriptions.set(channelName, count + 1);
    
    return isPrivate ? (echoInstance as Echo<'reverb'>).private(channelName) : (echoInstance as Echo<'reverb'>).channel(channelName);
  }, [echoInstance, subscriptions]);

  const leaveChannel = useCallback((channelName: string) => {
    if (!echoInstance) return;
    
    const count = (subscriptions.get(channelName) || 0) - 1;
    if (count <= 0) {
      subscriptions.delete(channelName);
      (echoInstance as Echo<'reverb'>).leave(channelName);
    } else {
      subscriptions.set(channelName, count);
    }
  }, [echoInstance, subscriptions]);

  return createElement(
    ReverbContext.Provider,
    { value: { subscribe, leaveChannel, isConnected: !!echoInstance && socketConnected, echo: echoInstance } },
    children
  );
}

export function useReverb() {
  return useContext(ReverbContext);
}
