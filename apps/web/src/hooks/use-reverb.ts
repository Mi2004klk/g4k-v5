import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Global echo instance
let echoInstance: Echo<any> | null = null;

export function getEchoInstance() {
  if (typeof window === 'undefined') return null;

  if (!echoInstance) {
    (window as any).Pusher = Pusher;

    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'app-key',
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
      wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT) : 8080,
      wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ? parseInt(process.env.NEXT_PUBLIC_REVERB_PORT) : 8080,
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
    });
  }

  return echoInstance;
}

export function useReverb() {
  const [isConnected, setIsConnected] = useState(true);

  const subscribe = (channelName: string, isPrivate: boolean = true) => {
    const echo = getEchoInstance();
    if (!echo) return null;

    return isPrivate ? echo.private(channelName) : echo.channel(channelName);
  };

  return { subscribe, isConnected };
}
