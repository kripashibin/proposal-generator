import "server-only";

import { GoogleGenAI } from "@google/genai";

// Free-tier model. Change here if you want higher quality (e.g.
// "gemini-2.5-pro") at the cost of a much lower free-tier rate limit.
export const PROPOSAL_GENERATION_MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing required environment variable: GEMINI_API_KEY");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
