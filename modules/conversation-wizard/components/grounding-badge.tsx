"use client";

/**
 * GroundingBadge — displays a small badge indicating the knowledge-base source
 * that grounds a factual claim in an assistant message.
 *
 * Uses the PermaBrasilis color tokens for principles (1–12),
 * teal for frameworks, and a neutral color for SDGs.
 *
 * Requirements: 7.3 (visible but non-intrusive source indicator)
 */

import { cn } from "@/lib/utils";

export interface GroundingRef {
  type: "principle" | "framework" | "sdg";
  id: string | number;
}

/** Maps principle colorToken names to CSS custom property names. */
const principleColorMap: Record<number, string> = {
  1: "var(--color-perma-green)",
  2: "var(--color-perma-teal)",
  3: "var(--color-perma-terra)",
  4: "var(--color-perma-dragon)",
  5: "var(--color-perma-navy)",
  6: "var(--color-perma-olive)",
  7: "var(--color-perma-gold)",
  8: "var(--color-perma-purple)",
  9: "var(--color-perma-slate)",
  10: "var(--color-perma-forest)",
  11: "var(--color-perma-sky)",
  12: "var(--color-perma-burgundy)",
};

/** Principles whose background color is too light for white text (AA contrast). */
const DARK_TEXT_PRINCIPLES = new Set([7]); // gold

function getLabel(ref: GroundingRef): string {
  switch (ref.type) {
    case "principle":
      return `Princípio ${ref.id}`;
    case "framework":
      return String(ref.id).toUpperCase();
    case "sdg":
      return `ODS ${ref.id}`;
  }
}

function getTooltip(ref: GroundingRef): string {
  switch (ref.type) {
    case "principle":
      return `Fundamentado no Princípio ${ref.id} da Permacultura`;
    case "framework":
      return `Fundamentado no framework ${String(ref.id).toUpperCase()}`;
    case "sdg":
      return `Fundamentado no Objetivo de Desenvolvimento Sustentável ${ref.id}`;
  }
}

interface GroundingBadgeProps {
  ref_: GroundingRef;
  className?: string;
}

export function GroundingBadge({ ref_, className }: GroundingBadgeProps) {
  const label = getLabel(ref_);
  const tooltip = getTooltip(ref_);

  const bgColor =
    ref_.type === "principle"
      ? principleColorMap[Number(ref_.id)] ?? "var(--color-perma-teal)"
      : ref_.type === "framework"
        ? "var(--color-perma-teal)"
        : "var(--color-perma-navy)";

  const needsDarkText =
    ref_.type === "principle" && DARK_TEXT_PRINCIPLES.has(Number(ref_.id));

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight",
        needsDarkText ? "text-gray-900" : "text-white",
        className,
      )}
      style={{ backgroundColor: bgColor }}
      title={tooltip}
      aria-label={tooltip}
      role="note"
    >
      {label}
    </span>
  );
}
