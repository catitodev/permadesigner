/**
 * Script to update knowledge-base schemas to support i18n fields.
 * Fields that contain translatable text accept either a plain string (pt-BR legacy)
 * or an object with locale keys { "pt-BR": "...", "en": "...", "es": "..." }.
 *
 * Run: npx tsx scripts/update-schemas-i18n.ts
 */

import { writeFileSync } from "fs";
import { resolve } from "path";

const SCHEMA_DIR = resolve(import.meta.dirname, "../knowledge-base/schema");

// Helper: a field that accepts string OR locale object
const localizableString = {
  oneOf: [
    { type: "string" },
    {
      type: "object",
      required: ["pt-BR"],
      properties: {
        "pt-BR": { type: "string" },
        en: { type: "string" },
        es: { type: "string" },
      },
      additionalProperties: false,
    },
  ],
};

// --- Principles schema ---
const principlesSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Principles",
  type: "array",
  minItems: 12,
  maxItems: 12,
  items: {
    type: "object",
    required: ["id", "name", "description", "guidingQuestion", "colorToken"],
    properties: {
      id: { type: "integer", minimum: 1, maximum: 12 },
      name: localizableString,
      description: localizableString,
      guidingQuestion: localizableString,
      colorToken: { type: "string" },
    },
    additionalProperties: false,
  },
};

// --- Frameworks schema ---
const frameworksSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Frameworks",
  type: "array",
  minItems: 1,
  items: {
    type: "object",
    required: ["id", "name", "subtitle", "origin", "type", "linearity", "description", "stages", "bestFor", "special", "sourceLicense"],
    properties: {
      id: { type: "string", pattern: "^[a-z][a-z0-9_]*$" },
      name: localizableString,
      subtitle: localizableString,
      origin: localizableString,
      type: localizableString,
      linearity: localizableString,
      description: localizableString,
      sigla: { oneOf: [{ type: "null" }, { type: "array", items: { type: "object", required: ["letter", "meaning"], properties: { letter: { type: "string" }, meaning: localizableString }, additionalProperties: false } }] },
      stages: { type: "array", items: { type: "string" } },
      bestFor: { type: "array", items: localizableString },
      special: localizableString,
      sourceLicense: localizableString,
    },
    additionalProperties: false,
  },
};

// --- SDGs schema ---
const sdgsSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SDGs",
  type: "array",
  minItems: 17,
  maxItems: 17,
  items: {
    type: "object",
    required: ["id", "title", "officialColorHex"],
    properties: {
      id: { type: "integer", minimum: 1, maximum: 17 },
      title: localizableString,
      officialColorHex: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    },
    additionalProperties: false,
  },
};

// --- Nature patterns schema ---
const naturePatternsSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Nature Patterns",
  type: "array",
  minItems: 1,
  items: {
    type: "object",
    required: ["id", "name", "description", "guidingQuestions", "relatedPrincipleIds"],
    properties: {
      id: { type: "string", pattern: "^[a-z][a-z0-9-]*$" },
      name: localizableString,
      description: localizableString,
      guidingQuestions: { type: "array", items: localizableString },
      relatedPrincipleIds: { type: "array", items: { type: "integer", minimum: 1, maximum: 12 } },
    },
    additionalProperties: false,
  },
};

// Write all schemas
const schemas: [string, unknown][] = [
  ["principles.schema.json", principlesSchema],
  ["frameworks.schema.json", frameworksSchema],
  ["sdgs.schema.json", sdgsSchema],
  ["nature-patterns.schema.json", naturePatternsSchema],
];

for (const [filename, schema] of schemas) {
  const path = resolve(SCHEMA_DIR, filename);
  writeFileSync(path, JSON.stringify(schema, null, 2), "utf-8");
  console.log(`✅ Updated ${filename}`);
}

console.log("\n🌱 All schemas updated for i18n support.");
