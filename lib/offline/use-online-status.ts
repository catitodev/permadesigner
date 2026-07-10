"use client";

import { useState, useEffect, useCallback } from "react";
import { syncOfflineQueue, getOfflineQueue } from "./queue";

/**
 * Hook that tracks online/offline status and syncs queued messages on reconnect.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = useCallback(() => {
    setPendingCount(getOfflineQueue().length);
  }, []);

  useEffect(() => {
    // Initialize with actual browser state
    setIsOnline(navigator.onLine);
    updatePendingCount();

    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        setIsSyncing(true);
        await syncOfflineQueue();
        setIsSyncing(false);
        updatePendingCount();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updatePendingCount]);

  return { isOnline, isSyncing, pendingCount, updatePendingCount };
}
