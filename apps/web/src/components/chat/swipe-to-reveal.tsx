"use client";

import React, { useState, useRef, useEffect, ReactNode, TouchEvent } from "react";
import { cn } from "@/lib/utils";

interface SwipeToRevealProps {
  children: ReactNode;
  actions: ReactNode;
  actionWidth?: number; // Total width of the actions revealed behind
}

export function SwipeToReveal({ children, actions, actionWidth = 140 }: SwipeToRevealProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = translateX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Calculate new X, allowing some elasticity if pulling past max
    let newX = currentXRef.current + diff;
    
    // Prevent dragging to the right (positive X) beyond 0
    if (newX > 0) newX = 0;
    // Add resistance if pulling past actionWidth
    if (newX < -actionWidth) {
      const excess = Math.abs(newX) - actionWidth;
      newX = -actionWidth - (excess * 0.2); 
    }
    
    setTranslateX(newX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to open or closed based on threshold (e.g. half of actionWidth)
    if (translateX < -(actionWidth * 0.4)) {
      setTranslateX(-actionWidth);
    } else {
      setTranslateX(0);
    }
  };

  // Close the reveal if clicking elsewhere
  useEffect(() => {
    if (translateX === 0) return;
    
    const handleGlobalClick = () => {
      setTranslateX(0);
    };
    
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("touchstart", handleGlobalClick);
    
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("touchstart", handleGlobalClick);
    };
  }, [translateX]);

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center bg-neutral-100 dark:bg-neutral-800">
      {/* Actions (Background layer) */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex items-center justify-end"
        style={{ width: actionWidth }}
      >
        {actions}
      </div>

      {/* Main Content (Foreground layer) */}
      <div
        className={cn(
          "w-full h-full relative z-10 bg-app",
          !isDragging && "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // Prevent click from propagating if we just finished dragging open
        onClick={(e) => {
           if (translateX !== 0) e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
}
