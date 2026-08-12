import { Card, SectionHeading, SectionShell } from "./shared";
import type { ExecutiveSummaryContent } from "@/lib/proposal/content-schema";

export function ExecutiveSummary({
  content,
  organizationName,
}: {
  content: ExecutiveSummaryContent;
  organizationName: string;
}) {
  return (
    <SectionShell pageNumber={2} companyName={organizationName}>
      <SectionHeading eyebrow="Executive Summary" title={content.title} pageNumber={2} />

      <p className="max-w-[64ch] text-[15px] leading-relaxed text-[#525a66]">{content.intro}</p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {content.stats.map((stat, index) => (
          <div key={index} className="rounded-2xl bg-[#0a0a0c] p-5 text-white">
            <p className="text-[26px] font-bold leading-none">{stat.value}</p>
            <p className="mt-2 text-[12px] leading-snug text-[#c7cbd1]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-[15px] font-bold text-[#0a0a0c]">Business objective</p>
          <p className="mt-2 text-sm leading-relaxed text-[#525a66]">
            {content.businessObjective}
          </p>
        </Card>
        <Card>
          <p className="text-[15px] font-bold text-[#0a0a0c]">Expected outcome</p>
          <p className="mt-2 text-sm leading-relaxed text-[#525a66]">{content.expectedOutcome}</p>
        </Card>
      </div>
    </SectionShell>
  );
}
