import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTimerStore } from '../stores/timer-store';

describe('Timer Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTimerStore.setState({
      isActive: false,
      isOnBreak: false,
      clockInTimestamp: null,
      currentBreakStart: null,
      totalSecondsToday: 0,
      activeSeconds: 0,
      tickIntervalId: null,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    const state = useTimerStore.getState();
    if (state.tickIntervalId) {
      clearInterval(state.tickIntervalId);
    }
    vi.useRealTimers();
  });

  it('initializes with default state', () => {
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isOnBreak).toBe(false);
    expect(state.activeSeconds).toBe(0);
  });

  it('starts the timer correctly', () => {
    const now = new Date().toISOString();
    useTimerStore.getState().startTimer(now, 10);
    
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.clockInTimestamp).toBe(now);
    expect(state.activeSeconds).toBe(10);
    expect(state.tickIntervalId).not.toBeNull();
  });

  it('increments activeSeconds on tick', () => {
    const now = new Date().toISOString();
    useTimerStore.getState().startTimer(now, 0);
    
    expect(useTimerStore.getState().activeSeconds).toBe(0);
    
    // Advance time by 3 seconds
    vi.advanceTimersByTime(3000);
    
    expect(useTimerStore.getState().activeSeconds).toBe(3);
  });

  it('pauses ticking when on break', () => {
    const now = new Date().toISOString();
    useTimerStore.getState().startTimer(now, 0);
    
    vi.advanceTimersByTime(2000);
    expect(useTimerStore.getState().activeSeconds).toBe(2);
    
    // Start break
    useTimerStore.getState().startBreak(new Date().toISOString());
    expect(useTimerStore.getState().isOnBreak).toBe(true);
    
    // Advance time by another 2 seconds
    vi.advanceTimersByTime(2000);
    
    // Should still be 2, because break pauses the tick
    expect(useTimerStore.getState().activeSeconds).toBe(2);
  });

  it('resumes ticking when break ends', () => {
    const now = new Date().toISOString();
    useTimerStore.getState().startTimer(now, 0);
    
    useTimerStore.getState().startBreak(new Date().toISOString());
    vi.advanceTimersByTime(2000);
    expect(useTimerStore.getState().activeSeconds).toBe(0);
    
    // End break
    useTimerStore.getState().endBreak();
    expect(useTimerStore.getState().isOnBreak).toBe(false);
    
    // Advance time by 2 seconds
    vi.advanceTimersByTime(2000);
    
    expect(useTimerStore.getState().activeSeconds).toBe(2);
  });

  it('stops the timer completely', () => {
    const now = new Date().toISOString();
    useTimerStore.getState().startTimer(now, 0);
    
    useTimerStore.getState().stopTimer();
    
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.tickIntervalId).toBeNull();
  });
});
