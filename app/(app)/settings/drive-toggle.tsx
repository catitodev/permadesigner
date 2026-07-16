"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DriveToggleProps {
  connected: boolean;
}

export function DriveToggle({ connected: initialConnected }: DriveToggleProps) {
  const [connected, setConnected] = useState(initialConnected);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    // Redirect to OAuth flow
    window.location.href = "/api/integrations/google-drive/connect";
  }

  async function handleDisconnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/google-drive/revoke", { method: "POST" });
      if (res.ok) setConnected(false);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Google Drive</p>
        <p className="text-xs text-muted-foreground">
          {connected ? "Conectado — documentos salvos no seu Drive" : "Salve documentos automaticamente no seu Drive"}
        </p>
      </div>
      {connected ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={loading}
          className="text-destructive border-destructive/30"
        >
          {loading ? "..." : "Desconectar"}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnect}
          className="border-perma-green/30 hover:bg-perma-green/5"
        >
          Conectar
        </Button>
      )}
    </div>
  );
}
