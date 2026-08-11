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
      baseSeconds: 0,
      lastActiveTimestamp: null,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default state', () => {
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.isOnBreak).toBe(false);
    expect(state.baseSeconds).toBe(0);
  });

  it('starts the timer correctly', () => {
    const now = new Date().toISOString();
    useTimerStore.getState().startTimer(now, 10);
    
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.clockInTimestamp).toBe(now);
    expect(state.baseSeconds).toBe(10);
    expect(state.lastActiveTimestamp).toBe(now);
  });

  it('accumulates baseSeconds when starting a break', () => {
    const start = new Date('2026-01-01T10:00:00Z').toISOString();
    const breakStart = new Date('2026-01-01T10:00:10Z').toISOString();
    
    useTimerStore.getState().startTimer(start, 0);
    
    expect(useTimerStore.getState().baseSeconds).toBe(0);
    
    // Start break 10 seconds later
    useTimerStore.getState().startBreak(breakStart);
    
    const state = useTimerStore.getState();
    expect(state.isOnBreak).toBe(true);
    expect(state.baseSeconds).toBe(10);
    expect(state.lastActiveTimestamp).toBeNull();
  });

  it('resumes properly when break ends', () => {
    const breakEnd = new Date('2026-01-01T10:05:00Z').toISOString();
    
    // Setup break state
    useTimerStore.setState({
      isActive: true,
      isOnBreak: true,
      baseSeconds: 10,
    });
    
    // End break
    useTimerStore.getState().endBreak(breakEnd);
    
    const state = useTimerStore.getState();
    expect(state.isOnBreak).toBe(false);
    expect(state.baseSeconds).toBe(10);
    expect(state.lastActiveTimestamp).toBe(breakEnd);
  });

  it('stops the timer completely', () => {
    const now = new Date().toISOString();
    useTimerStore.getState().startTimer(now, 0);
    
    useTimerStore.getState().stopTimer();
    
    const state = useTimerStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.lastActiveTimestamp).toBeNull();
  });
});
