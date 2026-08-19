import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '@/lib/api-client';

interface TimerState {
  isActive: boolean;
  isOnBreak: boolean;
  clockInTimestamp: string | null;
  currentBreakStart: string | null;
  baseSeconds: number; // Accumulated seconds BEFORE the current active period
  lastActiveTimestamp: string | null; // The exact timestamp when we last resumed/clocked in
  standardSeconds: number; // Standard working hours in seconds for the day
  
  // Actions
  setStandardSeconds: (seconds: number) => void;
  startTimer: (clockInTime: string, initialTotalSeconds: number) => void;
  stopTimer: () => void;
  startBreak: (breakStartTime: string) => void;
  endBreak: (endBreakTime: string) => void;
  syncWithServer: (day: any, events: any[], standardSeconds?: number) => void;
  // Project/Task Timer
  activeProjectId: string | null;
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  projectTimerStartedAt: number | null;
  projectTimerAccumulatedSeconds: number;
  isProjectTimerRunning: boolean;

  startProjectTimer: (projectId: string, taskId: string, title: string) => void;
  pauseProjectTimer: () => void;
  resumeProjectTimer: () => void;
  stopProjectTimer: () => { elapsedSeconds: number; taskId: string | null; projectId: string | null };
}

export const DEFAULT_STANDARD_SECONDS = 31500;

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
  isActive: false,
  isOnBreak: false,
  clockInTimestamp: null,
  currentBreakStart: null,
  baseSeconds: 0,
  lastActiveTimestamp: null,
  standardSeconds: 31500, // Default to 8 hours

  setStandardSeconds: (seconds: number) => set({ standardSeconds: seconds }),

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

  syncWithServer: (day: any, events: any[], providedStandardSeconds?: number) => {
    if (!day || events.length === 0) {
      get().stopTimer();
      set({ baseSeconds: 0, lastActiveTimestamp: null });
      return;
    }

    const initialTotalSeconds = day.total_seconds || 0;
    const standardSeconds = providedStandardSeconds || day.standard_seconds || DEFAULT_STANDARD_SECONDS;
    
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
        standardSeconds: standardSeconds,
      });
    } else {
      get().stopTimer();
      set({ baseSeconds: initialTotalSeconds, standardSeconds: standardSeconds });
    }
  },

  // Project Timer Implementation
  activeProjectId: null,
  activeTaskId: null,
  activeTaskTitle: null,
  projectTimerStartedAt: null,
  projectTimerAccumulatedSeconds: 0,
  isProjectTimerRunning: false,

  startProjectTimer: (projectId: string, taskId: string, title: string) => {
    set({
      activeProjectId: projectId,
      activeTaskId: taskId,
      activeTaskTitle: title,
      projectTimerStartedAt: Date.now(),
      projectTimerAccumulatedSeconds: 0,
      isProjectTimerRunning: true,
    });
    // Fire and forget sync to backend
    apiFetch('/timer/active', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, task_id: taskId === 'none' ? null : taskId, task_title: title })
    }).catch(console.error);
  },

  pauseProjectTimer: () => {
    const { isProjectTimerRunning, projectTimerStartedAt, projectTimerAccumulatedSeconds } = get();
    if (!isProjectTimerRunning || !projectTimerStartedAt) return;
    const elapsed = Math.floor((Date.now() - projectTimerStartedAt) / 1000);
    set({
      isProjectTimerRunning: false,
      projectTimerStartedAt: null,
      projectTimerAccumulatedSeconds: projectTimerAccumulatedSeconds + elapsed,
    });
    apiFetch('/timer/active/clear', { method: 'POST' }).catch(console.error);
  },

  resumeProjectTimer: () => {
    const { activeTaskId, activeProjectId, activeTaskTitle, isProjectTimerRunning } = get();
    if (!activeTaskId || isProjectTimerRunning) return;
    set({
      isProjectTimerRunning: true,
      projectTimerStartedAt: Date.now(),
    });
    apiFetch('/timer/active', {
      method: 'POST',
      body: JSON.stringify({ project_id: activeProjectId, task_id: activeTaskId === 'none' ? null : activeTaskId, task_title: activeTaskTitle })
    }).catch(console.error);
  },

  stopProjectTimer: () => {
    const {
      isProjectTimerRunning,
      projectTimerStartedAt,
      projectTimerAccumulatedSeconds,
      activeTaskId,
      activeProjectId,
    } = get();
    
    let totalSeconds = projectTimerAccumulatedSeconds;
    if (isProjectTimerRunning && projectTimerStartedAt) {
      totalSeconds += Math.floor((Date.now() - projectTimerStartedAt) / 1000);
    }
    
    const tId = activeTaskId;
    const pId = activeProjectId;
    
    set({
      activeProjectId: null,
      activeTaskId: null,
      activeTaskTitle: null,
      projectTimerStartedAt: null,
      projectTimerAccumulatedSeconds: 0,
      isProjectTimerRunning: false,
    });
    
    apiFetch('/timer/active/clear', { method: 'POST' }).catch(console.error);

    return { elapsedSeconds: totalSeconds, taskId: tId, projectId: pId };
  },
}), {  
  name: 'g4k-timer',
  skipHydration: true,
}));
