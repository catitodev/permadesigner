"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveThemePreference } from "@/app/(app)/actions/theme";

const THEME_CYCLE = ["system", "light", "dark"] as const;

const THEME_ICONS: Record<string, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const THEME_LABELS: Record<string, string> = {
  system: "Tema do sistema",
  light: "Tema claro",
  dark: "Tema escuro",
};

/**
 * ThemeToggle cycles through system → light → dark on click.
 * Persists the choice via server action to the user's profile.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch — render a placeholder with same dimensions
    return (
      <Button variant="ghost" size="icon" aria-label="Alternar tema" disabled>
        <Monitor className="size-4" />
      </Button>
    );
  }

  const currentTheme = theme ?? "system";
  const currentIndex = THEME_CYCLE.indexOf(
    currentTheme as (typeof THEME_CYCLE)[number]
  );
  const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
  const nextTheme = THEME_CYCLE[nextIndex];

  const Icon = THEME_ICONS[currentTheme] ?? Monitor;

  function handleToggle() {
    setTheme(nextTheme);
    // Fire-and-forget — persist to DB without blocking the UI
    saveThemePreference(nextTheme);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label="Alternar tema"
      title={THEME_LABELS[currentTheme]}
    >
      <Icon className="size-4" />
    </Button>
  );
}
