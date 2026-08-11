import { create } from 'zustand';

interface TimerState {
  isActive: boolean;
  isOnBreak: boolean;
  clockInTimestamp: string | null;
  currentBreakStart: string | null;
  baseSeconds: number; // Accumulated seconds BEFORE the current active period
  lastActiveTimestamp: string | null; // The exact timestamp when we last resumed/clocked in
  
  // Actions
  startTimer: (clockInTime: string, initialTotalSeconds: number) => void;
  stopTimer: () => void;
  startBreak: (breakStartTime: string) => void;
  endBreak: (endBreakTime: string) => void;
  syncWithServer: (day: any, events: any[]) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isActive: false,
  isOnBreak: false,
  clockInTimestamp: null,
  currentBreakStart: null,
  baseSeconds: 0,
  lastActiveTimestamp: null,

  startTimer: (clockInTime: string, initialTotalSeconds: number) => {
    set({
      isActive: true,
      isOnBreak: false,
      clockInTimestamp: clockInTime,
      baseSeconds: initialTotalSeconds,
      lastActiveTimestamp: clockInTime,
    });
  },

  stopTimer: () => {
    set({
      isActive: false,
      isOnBreak: false,
      lastActiveTimestamp: null,
    });
  },

  startBreak: (breakStartTime: string) => {
    // Before going on break, we must accumulate the seconds from the current active period
    const { lastActiveTimestamp, baseSeconds } = get();
    let updatedBaseSeconds = baseSeconds;
    
    if (lastActiveTimestamp) {
      const elapsedSinceLastEvent = Math.floor((new Date(breakStartTime).getTime() - new Date(lastActiveTimestamp).getTime()) / 1000);
      updatedBaseSeconds += Math.max(0, elapsedSinceLastEvent);
    }

    set({
      isOnBreak: true,
      currentBreakStart: breakStartTime,
      baseSeconds: updatedBaseSeconds,
      lastActiveTimestamp: null, // Timer should stop visually
    });
  },

  endBreak: (endBreakTime: string) => {
    set({
      isOnBreak: false,
      currentBreakStart: null,
      lastActiveTimestamp: endBreakTime,
    });
  },

  syncWithServer: (day: any, events: any[]) => {
    if (!day || events.length === 0) {
      get().stopTimer();
      set({ baseSeconds: 0, lastActiveTimestamp: null });
      return;
    }

    const initialTotalSeconds = day.total_seconds || 0;
    
    // Determine active state based on events
    let isActive = false;
    let isOnBreak = false;
    let clockInTimestamp: string | null = null;
    let currentBreakStart: string | null = null;
    let lastActiveEventTimestamp: string | null = null;

    events.forEach(event => {
      if (event.type === 'clock_in') {
        isActive = true;
        clockInTimestamp = event.timestamp;
        lastActiveEventTimestamp = event.timestamp;
      } else if (event.type === 'clock_out') {
        isActive = false;
        clockInTimestamp = null;
        lastActiveEventTimestamp = null;
      } else if (event.type === 'break_start') {
        isOnBreak = true;
        currentBreakStart = event.timestamp;
        lastActiveEventTimestamp = null; // Timer pauses on break
      } else if (event.type === 'break_end') {
        isOnBreak = false;
        currentBreakStart = null;
        lastActiveEventTimestamp = event.timestamp;
      }
    });

    if (isActive) {
      set({
        isActive: true,
        isOnBreak: isOnBreak,
        clockInTimestamp: clockInTimestamp,
        currentBreakStart: currentBreakStart,
        baseSeconds: initialTotalSeconds,
        lastActiveTimestamp: lastActiveEventTimestamp,
      });
    } else {
      get().stopTimer();
      set({ baseSeconds: initialTotalSeconds });
    }
  },
}));
