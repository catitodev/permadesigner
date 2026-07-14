"use client";

import { useTheme } from "next-themes";
import { saveThemePreference } from "@/app/(app)/actions/theme";

interface ThemeSelectProps {
  currentTheme: string;
}

export function ThemeSelect({ currentTheme }: ThemeSelectProps) {
  const { setTheme } = useTheme();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setTheme(value);
    saveThemePreference(value);
  }

  return (
    <div className="flex items-center justify-between">
      <label htmlFor="theme-select" className="text-sm font-medium">
        Tema
      </label>
      <select
        id="theme-select"
        defaultValue={currentTheme}
        onChange={handleChange}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      >
        <option value="system">Sistema</option>
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
      </select>
    </div>
  );
}
