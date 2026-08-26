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
  subscribe: (channelName: string, isPrivate?: boolean) => any | null;
  leaveChannel: (channelName: string) => void;
  isConnected: boolean;
  echo: any | null;
}

const ReverbContext = createContext<ReverbContextType>({
  subscribe: () => null,
  leaveChannel: () => {},
  isConnected: false,
  echo: null,
});

/**
 * Determines whether the Pusher WebSocket server is reachable.
 * Returns false on Vercel preview/production domains when no explicit
 * NEXT_PUBLIC_PUSHER_HOST has been set – this prevents hundreds of
 * failed WebSocket connection attempts that flood the console.
 */
function isPusherAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const isAvailable = !!process.env.NEXT_PUBLIC_PUSHER_APP_KEY && !!process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;
  if (!isAvailable && process.env.NODE_ENV !== 'test') {
    console.warn("Realtime features are disabled: NEXT_PUBLIC_PUSHER_APP_KEY or NEXT_PUBLIC_PUSHER_APP_CLUSTER is missing from environment variables.");
  }
  return isAvailable;
}

export function ReverbProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [echoInstance, setEchoInstance] = useState<any | null>(null);
  // Real pusher socket state — NOT mere Echo-instance existence. Drives the
  // polling fallbacks in consumers (chat/notifications) when the socket drops.
  const [socketConnected, setSocketConnected] = useState(false);

  // Track subscription counts to prevent one component from leaving a channel used by another
  const [subscriptions] = useState<Map<string, number>>(() => new Map());

  useEffect(() => {
    // Only connect if we have a logged in user, token, AND Pusher is reachable
    if (!user || !token || !isPusherAvailable()) {
      if (typeof window !== 'undefined' && window.Echo) {
        (window.Echo as any).disconnect();
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEchoInstance(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocketConnected(false);
      return;
    }

    window.Pusher = Pusher;

    const echoConfig: any = {
      broadcaster: 'pusher',
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || '',
      forceTLS: true,
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || '/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          Accept: 'application/json',
        },
      },
    };

    const echo: any = new Echo(echoConfig);

    window.Echo = echo;
    setEchoInstance(echo);

    // actual connection, not just the Echo instance existing.
    const pusherInstance = ((echo.connector as unknown) as { pusher: { connection: Pusher['connection'], connect: () => void } })?.pusher;
    const connection = pusherInstance?.connection;
    let handleStateChange: (states: any) => void;
    if (connection) {
      // Seed from the current state in case the socket already settled
      setSocketConnected(connection.state === 'connected');
      
      handleStateChange = (states: { previous: string, current: string }) => {
        setSocketConnected(states.current === 'connected');
      };
      
      connection.bind('state_change', handleStateChange);
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
      if (connection && handleStateChange) {
        connection.unbind('state_change', handleStateChange);
      }
      setSocketConnected(false);
      echo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Note: Excluded 'token' to prevent full Echo reconnects every 15 minutes

  const subscribe = useCallback((channelName: string, isPrivate: boolean = false) => {
    if (!echoInstance) return null;
    
    // Auto-detect and standardize private channels
    const isActuallyPrivate = isPrivate || channelName.startsWith("private-");
    const cleanChannelName = channelName.replace(/^private-/, "");
    
    // Use the clean channel name for tracking to avoid dupes between "private-foo" and "foo"
    const count = subscriptions.get(cleanChannelName) || 0;
    subscriptions.set(cleanChannelName, count + 1);
    
    return isActuallyPrivate 
      ? (echoInstance as Echo<'pusher'>).private(cleanChannelName) 
      : (echoInstance as Echo<'pusher'>).channel(cleanChannelName);
  }, [echoInstance, subscriptions]);

  const leaveChannel = useCallback((channelName: string) => {
    if (!echoInstance) return;
    
    const cleanChannelName = channelName.replace(/^private-/, "");
    
    const count = (subscriptions.get(cleanChannelName) || 0) - 1;
    if (count <= 0) {
      subscriptions.delete(cleanChannelName);
      (echoInstance as Echo<'pusher'>).leave(cleanChannelName);
    } else {
      subscriptions.set(cleanChannelName, count);
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
