import { create } from "zustand";
import { persist } from "zustand/middleware";
import React from "react";

export interface RecentItem {
  id: string;
  type: "employee" | "leave" | "attendance" | "project" | "task";
  title: string;
  subtitle?: string;
  url: string;
  icon?: string;
  timestamp: number;
}

interface RecentStore {
  recentItems: RecentItem[];
  addItem: (item: Omit<RecentItem, "timestamp">) => void;
  clearItems: () => void;
}

const MAX_RECENT_ITEMS = 10;

export const useRecentStore = create<RecentStore>()(
  persist(
    (set) => ({
      recentItems: [],
      addItem: (item) =>
        set((state) => {
          // Remove existing item if it exists
          const filtered = state.recentItems.filter(
            (existing) => !(existing.id === item.id && existing.type === item.type)
          );
          
          const newItem: RecentItem = {
            ...item,
            timestamp: Date.now(),
          };

          // Add to beginning and slice to max length
          const newItems = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
          return { recentItems: newItems };
        }),
      clearItems: () => set({ recentItems: [] }),
    }),
    {
      name: "g4k-recent-store",
    }
  )
);
