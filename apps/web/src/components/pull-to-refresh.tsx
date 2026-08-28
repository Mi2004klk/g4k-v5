"use client";

import { useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { AppIcon } from "@g4k/ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
}

const THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const queryClient = useQueryClient();
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only engage if we are at the very top of the scrolling container
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    // Only respond to downward pulls
    if (distance > 0) {
      // Prevent native scroll behavior while pulling down
      if (e.cancelable) {
        e.preventDefault();
      }
      // Add resistance to the pull
      const pullAmount = Math.min(distance * 0.4, MAX_PULL);
      setPullDistance(pullAmount);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);

    if (pullDistance > THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(60); // Hold at refreshing height

      // Wait for queries to invalidate
      await queryClient.invalidateQueries();
      
      // Artificial delay for UX
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 500);
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, queryClient]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // We must use non-passive event listeners to preventDefault on touchmove
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const yTransform = isPulling || isRefreshing ? pullDistance : 0;
  
  // Calculate rotation for the spinner based on pull distance
  const rotateDeg = Math.min((pullDistance / THRESHOLD) * 360, 360);
  // Calculate opacity based on pull distance
  const opacity = Math.min(pullDistance / (THRESHOLD * 0.8), 1);

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      {/* The Pull Indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 flex justify-center items-center h-16 w-full z-0 transition-opacity duration-200 pointer-events-none",
          opacity > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{ opacity: isRefreshing ? 1 : opacity }}
      >
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-800 shadow-md border border-neutral-200 dark:border-neutral-700 text-primary-600 transition-transform"
          style={{ 
            transform: isRefreshing ? 'none' : `rotate(${rotateDeg}deg)`,
            transition: isPulling ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <AppIcon 
            name="loading" 
            size="sm" 
            className={cn(
              isRefreshing && "motion-safe:animate-spin text-primary-500",
              !isRefreshing && "text-neutral-400 dark:text-neutral-500"
            )} 
          />
        </div>
      </div>

      {/* The Scrollable Content */}
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 overflow-y-auto relative z-10 w-full",
          (!isPulling && !isRefreshing) && "transition-transform duration-300 ease-out"
        )}
        style={{ transform: `translateY(${yTransform}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
