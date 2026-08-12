import { MutedCard, SectionHeading, SectionShell } from "./shared";
import type { WhyUsContent } from "@/lib/proposal/content-schema";

export function WhyUs({
  content,
  organizationName,
}: {
  content: WhyUsContent;
  organizationName: string;
}) {
  return (
    <SectionShell pageNumber={5} companyName={organizationName}>
      <SectionHeading eyebrow="Why Us" title={content.title} pageNumber={5} />

      <p className="max-w-[64ch] text-[15px] leading-relaxed text-[#525a66]">{content.intro}</p>

      <div className="mt-6 space-y-3">
        {content.differentiators.map((item, index) => (
          <div key={index} className="rounded-2xl border border-[#e6e8ec] bg-white p-4">
            <p className="text-[14px] font-bold text-[#0a0a0c]">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#525a66]">{item.description}</p>
          </div>
        ))}
      </div>

      <MutedCard className="mt-6">
        <p className="text-[14px] font-bold text-[#0a0a0c]">{content.proofPointsTitle}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#5b6270]">{content.proofPointsBody}</p>
      </MutedCard>
    </SectionShell>
  );
}
