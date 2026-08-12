import { Card, SectionHeading, SectionShell } from "./shared";
import type { SolutionContent } from "@/lib/proposal/content-schema";

export function ProposedSolution({
  content,
  organizationName,
}: {
  content: SolutionContent;
  organizationName: string;
}) {
  return (
    <SectionShell pageNumber={4} companyName={organizationName}>
      <SectionHeading eyebrow="Proposed Solution" title={content.title} pageNumber={4} />

      <p className="max-w-[64ch] text-[15px] leading-relaxed text-[#525a66]">{content.intro}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {content.cards.map((card, index) => (
          <Card key={index}>
            <p className="text-[15px] font-bold text-[#0a0a0c]">
              {index + 1}. {card.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#525a66]">{card.description}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {content.steps.map((step, index) => (
          <div key={index} className="border-t-2 border-[#0a0a0c] pt-3">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">
              {step.stepLabel.toUpperCase()}
            </p>
            <p className="mt-1.5 text-[14px] font-bold text-[#0a0a0c]">{step.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#525a66]">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
