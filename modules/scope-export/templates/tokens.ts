/**
 * Shared design tokens for PDF/DOCX export and UI.
 * Same palette as the PermaBrasilis guides (PDF/PPTX).
 */

export const colors = {
  primary: "#2d6a4f",
  primaryLight: "#40916c",
  teal: "#0d9488",
  terra: "#c2552a",
  navy: "#1e3a5f",
  gold: "#b8860b",
  text: "#1a1a1a",
  textLight: "#4a4a4a",
  border: "#e5e7eb",
  background: "#ffffff",
  muted: "#f3f4f6",
} as const;

export const fonts = {
  heading: "Helvetica-Bold",
  body: "Helvetica",
} as const;

export const spacing = {
  pageMargin: 40,
  sectionGap: 20,
  paragraphGap: 8,
} as const;

/** Maps principle IDs to their colors. */
export const principleColors: Record<number, string> = {
  1: "#2d6a4f",
  2: "#0d9488",
  3: "#c2552a",
  4: "#b91c1c",
  5: "#1e3a5f",
  6: "#556b2f",
  7: "#b8860b",
  8: "#6b21a8",
  9: "#475569",
  10: "#1b4332",
  11: "#0284c7",
  12: "#7f1d1d",
};
