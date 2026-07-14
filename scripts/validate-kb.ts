/**
 * Validates all knowledge-base JSON files against their JSON Schemas.
 * Uses ajv for validation.
 *
 * Usage: npx tsx scripts/validate-kb.ts
 * Exit code 0 = all valid, 1 = validation errors found.
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const KB_DIR = resolve(import.meta.dirname, "../knowledge-base");
const SCHEMA_DIR = resolve(KB_DIR, "schema");

interface ValidationTarget {
  name: string;
  dataFile: string;
  schemaFile: string;
}

const targets: ValidationTarget[] = [
  {
    name: "frameworks",
    dataFile: "frameworks.json",
    schemaFile: "frameworks.schema.json",
  },
  {
    name: "principles",
    dataFile: "principles.json",
    schemaFile: "principles.schema.json",
  },
  {
    name: "sdgs",
    dataFile: "sdgs.json",
    schemaFile: "sdgs.schema.json",
  },
  {
    name: "nature-patterns",
    dataFile: "nature-patterns.json",
    schemaFile: "nature-patterns.schema.json",
  },
  {
    name: "design-skills",
    dataFile: "design-skills.json",
    schemaFile: "design-skills.schema.json",
  },
  {
    name: "oss-tools",
    dataFile: "oss-tools.json",
    schemaFile: "oss-tools.schema.json",
  },
];

function main(): void {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);

  let hasErrors = false;

  for (const target of targets) {
    const dataPath = resolve(KB_DIR, target.dataFile);
    const schemaPath = resolve(SCHEMA_DIR, target.schemaFile);

    let data: unknown;
    let schema: unknown;

    try {
      data = JSON.parse(readFileSync(dataPath, "utf-8"));
    } catch (err) {
      console.error(`❌ ${target.name}: Failed to read data file — ${dataPath}`);
      console.error(`   ${(err as Error).message}`);
      hasErrors = true;
      continue;
    }

    try {
      schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
    } catch (err) {
      console.error(`❌ ${target.name}: Failed to read schema file — ${schemaPath}`);
      console.error(`   ${(err as Error).message}`);
      hasErrors = true;
      continue;
    }

    const validate = ajv.compile(schema as object);
    const valid = validate(data);

    if (valid) {
      console.log(`✅ ${target.name}: Valid`);
    } else {
      hasErrors = true;
      console.error(`❌ ${target.name}: Validation failed`);
      for (const error of validate.errors ?? []) {
        console.error(`   • ${error.instancePath || "/"} — ${error.message}`);
        if (error.params) {
          console.error(`     ${JSON.stringify(error.params)}`);
        }
      }
    }
  }

  if (hasErrors) {
    console.error("\n💥 Knowledge base validation FAILED.");
    process.exit(1);
  } else {
    console.log("\n🌱 All knowledge base files are valid.");
    process.exit(0);
  }
}

main();
