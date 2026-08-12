import { customAlphabet } from "nanoid";

// URL-safe, no ambiguous characters, 24 chars — unguessable proposal token.
const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const generate = customAlphabet(alphabet, 24);

export function generatePublicToken(): string {
  return generate();
}
