"use client";

import { useState } from "react";

interface LocaleSelectProps {
  currentLocale: string;
}

const LOCALES = [
  { value: "pt-BR", label: "🇧🇷 Português (Brasil)" },
  { value: "en", label: "🇺🇸 English" },
  { value: "es", label: "🇪🇸 Español" },
];

export function LocaleSelect({ currentLocale }: LocaleSelectProps) {
  const [locale, setLocale] = useState(currentLocale);
  const [saving, setSaving] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setLocale(value);
    setSaving(true);
    try {
      await fetch("/api/user/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: value }),
      });
      // Reload to apply new locale
      window.location.reload();
    } catch {
      setLocale(currentLocale);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <label htmlFor="locale-select" className="text-sm font-medium">
        Idioma
      </label>
      <select
        id="locale-select"
        value={locale}
        onChange={handleChange}
        disabled={saving}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      >
        {LOCALES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}
