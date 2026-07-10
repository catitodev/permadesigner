"use client";

import { useOnlineStatus } from "@/lib/offline/use-online-status";

/**
 * Shows a banner when the app is offline or syncing pending messages.
 */
export function OfflineIndicator() {
  const { isOnline, isSyncing, pendingCount } = useOnlineStatus();

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg sm:left-auto sm:right-4 sm:w-auto ${
        !isOnline
          ? "bg-amber-500 text-white"
          : isSyncing
            ? "bg-blue-500 text-white"
            : "bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200"
      }`}
      role="status"
      aria-live="polite"
    >
      {!isOnline && (
        <>
          <span className="size-2 rounded-full bg-white/80 animate-pulse" />
          Sem conexão — suas mensagens serão enviadas quando voltar online
          {pendingCount > 0 && ` (${pendingCount} pendente${pendingCount > 1 ? "s" : ""})`}
        </>
      )}
      {isOnline && isSyncing && (
        <>
          <span className="size-2 rounded-full bg-white animate-spin" />
          Sincronizando mensagens pendentes...
        </>
      )}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <>
          {pendingCount} mensagem(ns) pendente(s) de sincronização
        </>
      )}
    </div>
  );
}
