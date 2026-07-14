/**
 * Token encryption/decryption using AES-256-GCM.
 * The encryption key comes from GOOGLE_DRIVE_ENCRYPTION_KEY env var (32 bytes hex = 64 chars).
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const keyHex = process.env.GOOGLE_DRIVE_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "GOOGLE_DRIVE_ENCRYPTION_KEY must be a 64-char hex string (32 bytes).",
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypts a JSON-serializable value. Returns a base64 string
 * containing IV + ciphertext + auth tag.
 */
export function encryptTokens(data: unknown): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: iv (12) + tag (16) + ciphertext
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypts a base64 string back into the original JSON value.
 */
export function decryptTokens<T = unknown>(encoded: string): T {
  const key = getKey();
  const combined = Buffer.from(encoded, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8")) as T;
}
