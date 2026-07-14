/**
 * generate-aliases.ts
 * Reads knowledge-base JSON files and generates a typed aliases map
 * for the GroundingValidator at modules/core/grounding/aliases.ts.
 *
 * Run: npm run generate:aliases
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const KB = resolve(ROOT, "knowledge-base");
const OUT = resolve(ROOT, "modules/core/grounding/aliases.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJSON<T>(filename: string): T {
  return JSON.parse(readFileSync(resolve(KB, filename), "utf-8")) as T;
}

function lower(s: string): string {
  return s.toLowerCase();
}

// ---------------------------------------------------------------------------
// Types for knowledge-base entries
// ---------------------------------------------------------------------------

interface Framework {
  id: string;
  name: string;
  sigla: { letter: string; meaning: string }[] | null;
}

interface Principle {
  id: number;
  name: string;
}

interface SDG {
  id: number;
  title: string;
}

interface NaturePattern {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Build alias maps
// ---------------------------------------------------------------------------

function buildFrameworkAliases(frameworks: Framework[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const fw of frameworks) {
    // Map the id itself
    map[lower(fw.id)] = fw.id;
    // Map the name
    map[lower(fw.name)] = fw.id;

    // If sigla exists, build the acronym and dotted variant
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
    // "princípio N"
    map[lower(`princípio ${p.id}`)] = id;
    // "princípio N - name"
    map[lower(`princípio ${p.id} - ${p.name}`)] = id;
    // "pN"
    map[lower(`p${p.id}`)] = id;
    // name itself
    map[lower(p.name)] = id;
  }

  return map;
}

function buildSDGAliases(sdgs: SDG[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const sdg of sdgs) {
    const id = String(sdg.id);
    // "ods N"
    map[lower(`ods ${sdg.id}`)] = id;
    // "ods N - title"
    map[lower(`ods ${sdg.id} - ${sdg.title}`)] = id;
    // title itself
    map[lower(sdg.title)] = id;
  }

  return map;
}

function buildNaturePatternAliases(patterns: NaturePattern[]): Record<string, string> {
  const map: Record<string, string> = {};

  for (const pat of patterns) {
    // id itself (kebab-case)
    map[lower(pat.id)] = pat.id;
    // name
    map[lower(pat.name)] = pat.id;
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
  mkdirSync(dirname(OUT), { recursive: true });
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
