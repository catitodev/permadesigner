"use client";

/**
 * UserMenu — avatar circular com foto do Google + menu dropdown.
 * Fallback: iniciais do nome sobre fundo PermaBrasilis.
 * Req: AP-1
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const PERMA_COLORS = [
  "#2d6a4f", "#0d9488", "#c2552a", "#b91c1c", "#1e3a5f", "#556b2f",
  "#b8860b", "#6b21a8", "#475569", "#1b4332", "#0284c7", "#7f1d1d",
];

interface UserMenuProps {
  avatarUrl?: string | null;
  displayName: string;
  email: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name[0] ?? "U").toUpperCase();
}

function getColor(email: string): string {
  const idx = email.charCodeAt(0) % PERMA_COLORS.length;
  return PERMA_COLORS[idx];
}

export function UserMenu({ avatarUrl, displayName, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(displayName || email);
  const bgColor = getColor(email);
  const showImg = avatarUrl && !imgError;

  return (
    <div className="relative flex items-center gap-2">
      <ThemeToggle />

      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="flex size-8 items-center justify-center overflow-hidden rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Menu do usuário"
        aria-expanded={open}
      >
        {showImg ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="size-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="flex size-full items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-lg border border-border bg-card shadow-lg">
          <div className="border-b px-3 py-2">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <nav className="py-1">
            <MenuLink href="/profile" label="Perfil" />
            <MenuLink href="/dashboard" label="Histórico" />
            <MenuLink href="/settings" label="Configurações" />
          </nav>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
    >
      {label}
    </Link>
  );
}
