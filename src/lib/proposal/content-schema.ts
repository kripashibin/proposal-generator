import { z } from "zod";

// Single source of truth for the AI-generated NARRATIVE content of a
// proposal. Every field here is prose the model writes from the brief
// description — client name, dates, pricing, and team identities are never
// part of this schema and are always read from the DB rows directly by the
// renderer, never from an AI response object.

export const coverSchema = z.object({
  headline: z.string().min(1).describe("Big bold cover headline, e.g. 'Building a faster, smarter growth engine for Acme Labs.'"),
  subhead: z.string().min(1).describe("One-paragraph subhead under the headline"),
});

export const executiveSummarySchema = z.object({
  title: z.string().min(1).describe("Section headline, e.g. 'What we are solving'"),
  intro: z.string().min(1),
  stats: z
    .array(
      z.object({
        value: z.string().min(1).describe("Short bold stat, e.g. '50%' or '<5m'"),
        label: z.string().min(1),
      }),
    )
    .length(3),
  businessObjective: z.string().min(1),
  expectedOutcome: z.string().min(1),
});

export const challengesSchema = z.object({
  title: z.string().min(1).describe("Section headline, e.g. 'Where growth is getting slowed down'"),
  cards: z
    .array(z.object({ title: z.string().min(1), description: z.string().min(1) }))
    .length(4),
  impactItems: z
    .array(z.object({ label: z.string().min(1), description: z.string().min(1) }))
    .min(3)
    .max(4),
});

export const solutionSchema = z.object({
  title: z.string().min(1).describe("Section headline, e.g. 'A focused AI automation layer'"),
  intro: z.string().min(1),
  cards: z
    .array(z.object({ title: z.string().min(1), description: z.string().min(1) }))
    .length(4),
  steps: z
    .array(
      z.object({
        stepLabel: z.string().min(1).describe("e.g. 'STEP 01'"),
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .length(4),
});

export const whyUsSchema = z.object({
  title: z.string().min(1).describe("Section headline, e.g. 'Practical delivery, not AI theatre'"),
  intro: z.string().min(1),
  differentiators: z
    .array(z.object({ title: z.string().min(1), description: z.string().min(1) }))
    .length(4),
  proofPointsTitle: z.string().min(1),
  proofPointsBody: z.string().min(1),
});

export const scopeSchema = z.object({
  title: z.string().min(1).describe("Section headline, e.g. 'What we will deliver'"),
  workstreams: z
    .array(
      z.object({
        workstream: z.string().min(1),
        deliverable: z.string().min(1),
        included: z.boolean(),
      }),
    )
    .min(4)
    .max(6),
  timeline: z
    .array(
      z.object({
        weekLabel: z.string().min(1).describe("e.g. 'WEEK 1'"),
        title: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .length(4),
});

export const teamSchema = z.object({
  title: z.string().min(1).describe("Section headline, e.g. 'Who will work with you'"),
  workingModelTitle: z.string().min(1),
  workingModelBody: z.string().min(1),
  communication: z.string().min(1),
  documentation: z.string().min(1),
  support: z.string().min(1),
});

export const investmentSchema = z.object({
  title: z.string().min(1).describe("Section headline, e.g. 'Simple project pricing'"),
  paymentScheduleText: z.string().min(1),
  optionalSupportText: z.string().min(1),
  disclaimerText: z.string().min(1),
});

export const agreementSchema = z.object({
  title: z.string().min(1).describe("Section headline, e.g. 'Ready when you are'"),
  intro: z.string().min(1),
  commercialTerms: z.array(z.string().min(1)).min(3).max(6),
  nextSteps: z.array(z.string().min(1)).min(3).max(5),
  thankYouBody: z.string().min(1),
});

export const proposalContentSchema = z.object({
  cover: coverSchema,
  executiveSummary: executiveSummarySchema,
  challenges: challengesSchema,
  solution: solutionSchema,
  whyUs: whyUsSchema,
  scope: scopeSchema,
  team: teamSchema,
  investment: investmentSchema,
  agreement: agreementSchema,
});

export type ProposalContent = z.infer<typeof proposalContentSchema>;
export type CoverContent = z.infer<typeof coverSchema>;
export type ExecutiveSummaryContent = z.infer<typeof executiveSummarySchema>;
export type ChallengesContent = z.infer<typeof challengesSchema>;
export type SolutionContent = z.infer<typeof solutionSchema>;
export type WhyUsContent = z.infer<typeof whyUsSchema>;
export type ScopeContent = z.infer<typeof scopeSchema>;
export type TeamContent = z.infer<typeof teamSchema>;
export type InvestmentContent = z.infer<typeof investmentSchema>;
export type AgreementContent = z.infer<typeof agreementSchema>;

// section_key <-> schema-slice mapping, used by both the generate route
// (whole-proposal or scoped regenerate) and the review screen.
export const SECTION_SCHEMAS = {
  cover: coverSchema,
  executive_summary: executiveSummarySchema,
  challenges: challengesSchema,
  solution: solutionSchema,
  why_us: whyUsSchema,
  scope: scopeSchema,
  team: teamSchema,
  investment: investmentSchema,
  agreement: agreementSchema,
} as const;

export const SECTION_ORDER = [
  "cover",
  "executive_summary",
  "challenges",
  "solution",
  "why_us",
  "scope",
  "team",
  "investment",
  "agreement",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

const CONTENT_KEY_BY_SECTION: Record<SectionKey, keyof ProposalContent> = {
  cover: "cover",
  executive_summary: "executiveSummary",
  challenges: "challenges",
  solution: "solution",
  why_us: "whyUs",
  scope: "scope",
  team: "team",
  investment: "investment",
  agreement: "agreement",
};

export function contentKeyForSection(section: SectionKey): keyof ProposalContent {
  return CONTENT_KEY_BY_SECTION[section];
}

// Fixed eyebrow labels for the public template — these are generic section
// labels, not AI-generated, and match proposal-template.pdf verbatim.
export const SECTION_EYEBROW: Record<SectionKey, string> = {
  cover: "",
  executive_summary: "EXECUTIVE SUMMARY",
  challenges: "CURRENT CHALLENGES",
  solution: "PROPOSED SOLUTION",
  why_us: "WHY US",
  scope: "SCOPE OF WORK",
  team: "TEAM",
  investment: "INVESTMENT",
  agreement: "AGREEMENT & NEXT STEPS",
};

// Page number shown on the public template (1-indexed, matches PDF).
export const SECTION_PAGE_NUMBER: Record<SectionKey, number> = {
  cover: 1,
  executive_summary: 2,
  challenges: 3,
  solution: 4,
  why_us: 5,
  scope: 6,
  team: 7,
  investment: 8,
  agreement: 9,
};
