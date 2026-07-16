"use client";

/**
 * InstallApp — PWA install prompt for mobile devices.
 * Captures the beforeinstallprompt event and shows a styled install button.
 * Only visible on mobile when the app is NOT already installed as PWA.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Capture the install prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detect if installed after the fact
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }

  // Don't show on desktop or if already installed
  if (!isMobile || isInstalled) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-perma-green/20 bg-perma-green/5 p-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">Instalar aplicativo</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Acesse mais rápido, funciona offline e recebe como app nativo.
        </p>
      </div>
      {deferredPrompt ? (
        <Button
          size="sm"
          onClick={handleInstall}
          className="ml-3 shrink-0 bg-perma-green hover:bg-perma-green/90"
        >
          Instalar
        </Button>
      ) : (
        <div className="ml-3 shrink-0 text-xs text-muted-foreground text-right max-w-[140px]">
          Use o menu do navegador → &quot;Adicionar à tela inicial&quot;
        </div>
      )}
    </div>
  );
}
