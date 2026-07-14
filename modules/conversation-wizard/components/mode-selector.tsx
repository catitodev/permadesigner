"use client";

/**
 * ModeSelector — toggle between Student and Designer navigation modes.
 * Persists to projects.navigation_mode via server action.
 * Req: NM-1
 */

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  projectId: string;
  currentMode: "student" | "designer";
}

export function ModeSelector({ projectId, currentMode }: ModeSelectorProps) {
  const [mode, setMode] = useState(currentMode);
  const [saving, setSaving] = useState(false);

  async function handleToggle(newMode: "student" | "designer") {
    if (newMode === mode || saving) return;
    setSaving(true);
    setMode(newMode);

    try {
      await fetch("/api/projects/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, mode: newMode }),
      });
    } catch {
      // Revert on failure
      setMode(mode);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 text-xs">
      <button
        type="button"
        onClick={() => handleToggle("student")}
        className={cn(
          "rounded-md px-2.5 py-1 transition-colors",
          mode === "student"
            ? "bg-perma-green text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={mode === "student"}
        aria-label="Modo Estudante"
      >
        🎓 Estudante
      </button>
      <button
        type="button"
        onClick={() => handleToggle("designer")}
        className={cn(
          "rounded-md px-2.5 py-1 transition-colors",
          mode === "designer"
            ? "bg-perma-teal text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={mode === "designer"}
        aria-label="Modo Designer"
      >
        🛠 Designer
      </button>
    </div>
  );
}
