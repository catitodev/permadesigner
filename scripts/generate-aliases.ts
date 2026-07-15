/**
 * generate-aliases.ts
 * Reads knowledge-base JSON files and generates a typed aliases map
 * for the GroundingValidator at modules/core/grounding/aliases.ts.
 *
 * Run: npm run generate:aliases
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname as pathDirname } from "node:path";

const KB = join(process.cwd(), "knowledge-base");
const OUT = join(process.cwd(), "modules", "core", "grounding", "aliases.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJSON<T>(filename: string): T {
  const fullPath = join(KB, filename);
  return JSON.parse(readFileSync(fullPath, "utf-8")) as T;
}

function lower(s: string): string {
  return s.toLowerCase();
}

/** Resolves a localizable field (string or {locale: string}) to pt-BR text. */
function resolve(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "pt-BR" in value) {
    return (value as Record<string, string>)["pt-BR"];
  }
  return String(value ?? "");
}

// ---------------------------------------------------------------------------
// Types for knowledge-base entries
// ---------------------------------------------------------------------------

interface Framework {
  id: string;
  name: unknown;
  sigla: { letter: string; meaning: string }[] | null;
}

interface Principle {
  id: number;
  name: unknown;
}

interface SDG {
  id: number;
  title: unknown;
}

interface NaturePattern {
  id: string;
  name: unknown;
}

// ---------------------------------------------------------------------------
// Build alias maps
// ---------------------------------------------------------------------------

function buildFrameworkAliases(frameworks: Framework[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const fw of frameworks) {
    map[lower(fw.id)] = fw.id;
    map[lower(resolve(fw.name))] = fw.id;

    if (fw.sigla && fw.sigla.length > 0) {
      const letters = fw.sigla.map((s) => s.letter).join("");
      const dotted = fw.sigla.map((s) => s.letter).join(".") + ".";

      map[lower(letters)] = fw.id;
      if (lower(dotted) !== lower(letters)) {
        map[lower(dotted)] = fw.id;
      }
    }
  }

  return map;
}

function buildPrincipleAliases(principles: Principle[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const p of principles) {
    const id = String(p.id);
    // pt-BR aliases
    const namePt = resolve(p.name);
    map[lower(`princípio ${p.id}`)] = id;
    map[lower(`princípio ${p.id} - ${namePt}`)] = id;
    map[lower(`p${p.id}`)] = id;
    map[lower(namePt)] = id;

    // en aliases
    const nameEn = typeof p.name === "object" ? (p.name as Record<string,string>).en ?? "" : "";
    if (nameEn) {
      map[lower(`principle ${p.id}`)] = id;
      map[lower(nameEn)] = id;
    }

    // es aliases
    const nameEs = typeof p.name === "object" ? (p.name as Record<string,string>).es ?? "" : "";
    if (nameEs) {
      map[lower(`principio ${p.id}`)] = id;
      map[lower(nameEs)] = id;
    }
  }

  return map;
}

function buildSDGAliases(sdgs: SDG[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const sdg of sdgs) {
    const id = String(sdg.id);
    const titlePt = resolve(sdg.title);
    map[lower(`ods ${sdg.id}`)] = id;
    map[lower(`ods ${sdg.id} - ${titlePt}`)] = id;
    map[lower(titlePt)] = id;

    // en
    const titleEn = typeof sdg.title === "object" ? (sdg.title as Record<string,string>).en ?? "" : "";
    if (titleEn) {
      map[lower(`sdg ${sdg.id}`)] = id;
      map[lower(titleEn)] = id;
    }

    // es
    const titleEs = typeof sdg.title === "object" ? (sdg.title as Record<string,string>).es ?? "" : "";
    if (titleEs) {
      map[lower(titleEs)] = id;
    }
  }

  return map;
}

function buildNaturePatternAliases(patterns: NaturePattern[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const pat of patterns) {
    map[lower(pat.id)] = pat.id;
    map[lower(resolve(pat.name))] = pat.id;

    // en/es names
    if (typeof pat.name === "object") {
      const names = pat.name as Record<string, string>;
      if (names.en) map[lower(names.en)] = pat.id;
      if (names.es) map[lower(names.es)] = pat.id;
    }
  }

  return map;
}

interface DesignSkill {
  id: string;
  name: string;
}

interface OssTool {
  id: string;
  name: string;
}

function buildDesignSkillAliases(skills: DesignSkill[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const s of skills) {
    map[lower(s.id)] = s.id;
    map[lower(s.name)] = s.id;
  }
  return map;
}

function buildOssToolAliases(tools: OssTool[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const t of tools) {
    map[lower(t.id)] = t.id;
    map[lower(t.name)] = t.id;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Generate output
// ---------------------------------------------------------------------------

function formatRecord(name: string, record: Record<string, string>): string {
  const entries = Object.entries(record)
    .map(([key, value]) => `  "${key}": "${value}",`)
    .join("\n");
  return `export const ${name}: Record<string, string> = {\n${entries}\n};`;
}

function main() {
  const frameworks = readJSON<Framework[]>("frameworks.json");
  const principles = readJSON<Principle[]>("principles.json");
  const sdgs = readJSON<SDG[]>("sdgs.json");
  const patterns = readJSON<NaturePattern[]>("nature-patterns.json");
  const skills = readJSON<DesignSkill[]>("design-skills.json");
  const tools = readJSON<OssTool[]>("oss-tools.json");

  const frameworkAliases = buildFrameworkAliases(frameworks);
  const principleAliases = buildPrincipleAliases(principles);
  const sdgAliases = buildSDGAliases(sdgs);
  const naturePatternAliases = buildNaturePatternAliases(patterns);
  const designSkillAliases = buildDesignSkillAliases(skills);
  const ossToolAliases = buildOssToolAliases(tools);

  const output = [
    "// AUTO-GENERATED — do not edit manually. Run `npm run generate:aliases` to regenerate.",
    "",
    formatRecord("frameworkAliases", frameworkAliases),
    "",
    formatRecord("principleAliases", principleAliases),
    "",
    formatRecord("sdgAliases", sdgAliases),
    "",
    formatRecord("naturePatternAliases", naturePatternAliases),
    "",
    formatRecord("designSkillAliases", designSkillAliases),
    "",
    formatRecord("ossToolAliases", ossToolAliases),
    "",
  ].join("\n");

  // Ensure output directory exists
  mkdirSync(pathDirname(OUT), { recursive: true });
  writeFileSync(OUT, output, "utf-8");

  console.log(`✅ Generated ${OUT}`);
  console.log(
    `   Frameworks: ${Object.keys(frameworkAliases).length} aliases | ` +
      `Principles: ${Object.keys(principleAliases).length} aliases | ` +
      `SDGs: ${Object.keys(sdgAliases).length} aliases | ` +
      `Patterns: ${Object.keys(naturePatternAliases).length} aliases | ` +
      `Skills: ${Object.keys(designSkillAliases).length} aliases | ` +
      `Tools: ${Object.keys(ossToolAliases).length} aliases`
  );
}

main();
