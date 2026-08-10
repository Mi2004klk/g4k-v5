import { useEffect } from "react";
import { useRecentStore, RecentItem } from "../stores/recent-store";

export function useTrackRecent(item: Omit<RecentItem, "timestamp"> | null | undefined) {
  const addItem = useRecentStore((state) => state.addItem);

  useEffect(() => {
    if (item && item.id) {
      addItem(item);
    }
  }, [item?.id, item?.title, addItem]);
}
