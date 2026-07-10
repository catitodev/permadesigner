/**
 * Offline message queue using localStorage.
 *
 * When the app is offline, messages are queued locally.
 * On reconnection, they are sent to /api/chat in order.
 *
 * Uses localStorage for simplicity (IndexedDB is overkill for small text messages).
 */

const QUEUE_KEY = "permadesigner_offline_queue";

export interface QueuedMessage {
  id: string;
  projectId: string;
  stageId: string;
  message: string;
  createdAt: string;
}

/**
 * Get all queued messages from localStorage.
 */
export function getOfflineQueue(): QueuedMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a message to the offline queue.
 */
export function enqueueOfflineMessage(
  projectId: string,
  stageId: string,
  message: string,
): QueuedMessage {
  const entry: QueuedMessage = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    stageId,
    message,
    createdAt: new Date().toISOString(),
  };

  const queue = getOfflineQueue();
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return entry;
}

/**
 * Remove a message from the queue (after successful sync).
 */
export function dequeueMessage(id: string): void {
  const queue = getOfflineQueue().filter((m) => m.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Clear the entire offline queue.
 */
export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Sync all queued messages with the server.
 * Returns the number of successfully synced messages.
 */
export async function syncOfflineQueue(): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let synced = 0;

  for (const entry of queue) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: entry.projectId,
          stageId: entry.stageId,
          message: entry.message,
        }),
      });

      if (res.ok) {
        dequeueMessage(entry.id);
        synced++;
      } else {
        // Stop syncing on first failure (server might be overloaded)
        break;
      }
    } catch {
      // Network still down, stop trying
      break;
    }
  }

  return synced;
}
