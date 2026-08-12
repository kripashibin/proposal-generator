import { Card, SectionHeading, SectionShell } from "./shared";
import type { ChallengesContent } from "@/lib/proposal/content-schema";

export function CurrentChallenges({
  content,
  organizationName,
}: {
  content: ChallengesContent;
  organizationName: string;
}) {
  return (
    <SectionShell pageNumber={3} companyName={organizationName}>
      <SectionHeading eyebrow="Current Challenges" title={content.title} pageNumber={3} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {content.cards.map((card, index) => (
          <Card key={index}>
            <p className="text-[15px] font-bold text-[#0a0a0c]">{card.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#525a66]">{card.description}</p>
          </Card>
        ))}
      </div>

      <p className="mb-3 mt-8 text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">
        IMPACT
      </p>
      <ol className="space-y-3">
        {content.impactItems.map((item, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[11px] font-bold text-[#1d4ed8]">
              {index + 1}
            </span>
            <p className="text-sm leading-relaxed text-[#525a66]">
              <span className="font-bold text-[#0a0a0c]">{item.label}: </span>
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
