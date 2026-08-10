import { create } from 'zustand';

interface TimerState {
  isActive: boolean;
  isOnBreak: boolean;
  clockInTimestamp: string | null;
  currentBreakStart: string | null;
  totalSecondsToday: number;
  activeSeconds: number; // accumulated actively this session
  tickIntervalId: NodeJS.Timeout | null;
  
  // Actions
  startTimer: (clockInTime: string, initialTotalSeconds: number) => void;
  stopTimer: () => void;
  startBreak: (breakStartTime: string) => void;
  endBreak: () => void;
  tick: () => void;
  syncWithServer: (day: any, events: any[]) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isActive: false,
  isOnBreak: false,
  clockInTimestamp: null,
  currentBreakStart: null,
  totalSecondsToday: 0,
  activeSeconds: 0,
  tickIntervalId: null,

  startTimer: (clockInTime: string, initialTotalSeconds: number) => {
    const { tickIntervalId } = get();
    if (tickIntervalId) clearInterval(tickIntervalId);

    const interval = setInterval(() => {
      get().tick();
    }, 1000);

    set({
      isActive: true,
      isOnBreak: false,
      clockInTimestamp: clockInTime,
      totalSecondsToday: initialTotalSeconds,
      activeSeconds: initialTotalSeconds,
      tickIntervalId: interval,
    });
  },

  stopTimer: () => {
    const { tickIntervalId } = get();
    if (tickIntervalId) clearInterval(tickIntervalId);
    
    set({
      isActive: false,
      isOnBreak: false,
      tickIntervalId: null,
    });
  },

  startBreak: (breakStartTime: string) => {
    set({
      isOnBreak: true,
      currentBreakStart: breakStartTime,
    });
  },

  endBreak: () => {
    set({
      isOnBreak: false,
      currentBreakStart: null,
    });
  },

  tick: () => {
    const state = get();
    if (!state.isActive || state.isOnBreak) return;
    
    set((s) => ({
      activeSeconds: s.activeSeconds + 1,
    }));
  },

  syncWithServer: (day: any, events: any[]) => {
    if (!day || events.length === 0) {
      get().stopTimer();
      set({ totalSecondsToday: 0, activeSeconds: 0 });
      return;
    }

    const initialTotalSeconds = day.total_seconds || 0;
    
    // Determine active state based on events
    let isActive = false;
    let isOnBreak = false;
    let clockInTimestamp: string | null = null;
    let currentBreakStart: string | null = null;

    events.forEach(event => {
      if (event.type === 'clock_in') {
        isActive = true;
        clockInTimestamp = event.timestamp;
      } else if (event.type === 'clock_out') {
        isActive = false;
        clockInTimestamp = null;
      } else if (event.type === 'break_start') {
        isOnBreak = true;
        currentBreakStart = event.timestamp;
      } else if (event.type === 'break_end') {
        isOnBreak = false;
        currentBreakStart = null;
      }
    });

    if (isActive) {
      // Calculate how many seconds have passed since the last active period started
      // Or rather, we just trust the server's total_seconds and start ticking from there.
      // If we want exact precision, we would compute `Date.now() - new Date(clockInTimestamp)`
      // but there could be breaks in between.
      // The easiest way is to let the server's `total_seconds` be the baseline,
      // and add the time elapsed since the *latest* relevant event if active.
      
      let baseSeconds = initialTotalSeconds;
      
      if (!isOnBreak) {
        // Find the latest event that made us active (clock_in or break_end)
        const lastActiveEvent = [...events].reverse().find(e => e.type === 'clock_in' || e.type === 'break_end');
        if (lastActiveEvent) {
          const elapsedSinceLastEvent = Math.floor((Date.now() - new Date(lastActiveEvent.timestamp).getTime()) / 1000);
          baseSeconds += Math.max(0, elapsedSinceLastEvent);
        }
      }

      get().startTimer(clockInTimestamp!, baseSeconds);
      if (isOnBreak) {
        get().startBreak(currentBreakStart!);
      }
    } else {
      get().stopTimer();
      set({ totalSecondsToday: initialTotalSeconds, activeSeconds: initialTotalSeconds });
    }
  },
}));
