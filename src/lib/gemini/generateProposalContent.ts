import "server-only";

import { z } from "zod";
import type { Content } from "@google/genai";
import { getGeminiClient, PROPOSAL_GENERATION_MODEL } from "./client";
import {
  proposalContentSchema,
  SECTION_SCHEMAS,
  contentKeyForSection,
  type ProposalContent,
  type SectionKey,
} from "@/lib/proposal/content-schema";

export interface GenerationInput {
  organizationName: string;
  clientCompany: string;
  clientContactName: string | null;
  eyebrowText: string;
  proposalDate: string;
  validForDays: number;
  currency: string;
  briefDescription: string;
  lineItems: { itemName: string; description: string | null; amountCents: number }[];
  totalAmountCents: number;
  amountDueCents: number;
  paymentType: "full" | "deposit" | "custom";
  teamMembers: { name: string; role: string | null; description: string | null }[];
}

const SYSTEM_PROMPT = `You write the narrative sections of a client-facing business proposal, in the voice of the company sending it (confident, concrete, non-generic). You are given factual context (client name, dates, pricing, team) purely for grounding — never invent, restate as a "fact", or change any client name, company name, date, price, or team member identity; those are supplied separately by the application and are not part of your output schema. Write only the narrative fields the schema asks for. Base everything on the brief description provided — do not invent unrelated capabilities or claims that description doesn't support. Avoid filler and generic AI-proposal language ("leverage synergies", "cutting-edge solutions"); be specific to what the brief actually describes. Respond with JSON only, matching the given schema exactly.`;

function buildContextBlock(input: GenerationInput): string {
  const lineItemsText = input.lineItems
    .map((item) => `- ${item.itemName}: $${(item.amountCents / 100).toFixed(2)}${item.description ? ` — ${item.description}` : ""}`)
    .join("\n");
  const teamText = input.teamMembers
    .map((member) => `- ${member.name}${member.role ? ` (${member.role})` : ""}${member.description ? `: ${member.description}` : ""}`)
    .join("\n");

  return `CONTEXT (for grounding only — do not restate these as new facts, and never invent alternatives to them):
Company sending the proposal: ${input.organizationName}
Client: ${input.clientCompany}${input.clientContactName ? ` (contact: ${input.clientContactName})` : ""}
Proposal type / eyebrow: ${input.eyebrowText}
Date: ${input.proposalDate}
Valid for: ${input.validForDays} days
Currency: ${input.currency}

Pricing line items:
${lineItemsText || "(none provided)"}
Total project investment: $${(input.totalAmountCents / 100).toFixed(2)}
Amount due now (${input.paymentType}): $${(input.amountDueCents / 100).toFixed(2)}

Team on this engagement:
${teamText || "(none provided — you may omit specific names from any narrative you write)"}

BRIEF DESCRIPTION FROM THE SENDER (the primary source for everything you write):
${input.briefDescription}`;
}

async function callWithRetry<Schema extends z.ZodTypeAny>(
  schema: Schema,
  userPrompt: string,
): Promise<z.infer<Schema>> {
  const client = getGeminiClient();
  const jsonSchema = z.toJSONSchema(schema);

  const contents: Content[] = [{ role: "user", parts: [{ text: userPrompt }] }];

  const config = {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseJsonSchema: jsonSchema,
  };

  const first = await client.models.generateContent({
    model: PROPOSAL_GENERATION_MODEL,
    contents,
    config,
  });

  const firstText = first.text ?? "";
  const firstParsed = tryParse(schema, firstText);
  if (firstParsed.success) {
    return firstParsed.data;
  }

  const retry = await client.models.generateContent({
    model: PROPOSAL_GENERATION_MODEL,
    contents: [
      ...contents,
      { role: "model", parts: [{ text: firstText }] },
      {
        role: "user",
        parts: [
          {
            text: `Your previous response did not validate against the required schema: ${firstParsed.issueSummary}. Return corrected JSON that fully matches the schema — every required field and array length must be present.`,
          },
        ],
      },
    ],
    config,
  });

  const retryParsed = tryParse(schema, retry.text ?? "");
  if (!retryParsed.success) {
    throw new Error("AI generation failed to produce valid structured content after one retry.");
  }

  return retryParsed.data;
}

function tryParse<Schema extends z.ZodTypeAny>(
  schema: Schema,
  text: string,
): { success: true; data: z.infer<Schema> } | { success: false; issueSummary: string } {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    return { success: false, issueSummary: "The response was not valid JSON." };
  }

  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    const issueSummary = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return { success: false, issueSummary };
  }

  return { success: true, data: result.data };
}

export async function generateFullProposalContent(
  input: GenerationInput,
): Promise<ProposalContent> {
  const context = buildContextBlock(input);
  const userPrompt = `${context}\n\nWrite the complete proposal narrative content matching the schema.`;
  return callWithRetry(proposalContentSchema, userPrompt);
}

export async function regenerateProposalSection(
  input: GenerationInput,
  section: SectionKey,
): Promise<Partial<ProposalContent>> {
  const schema = SECTION_SCHEMAS[section];
  const context = buildContextBlock(input);
  const userPrompt = `${context}\n\nWrite only the "${section}" section of the proposal, matching the schema exactly.`;
  const result = await callWithRetry(schema, userPrompt);
  const key = contentKeyForSection(section);
  return { [key]: result } as Partial<ProposalContent>;
}
