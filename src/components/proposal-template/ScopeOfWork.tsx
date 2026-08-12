import { SectionHeading, SectionShell } from "./shared";
import type { ScopeContent } from "@/lib/proposal/content-schema";

export function ScopeOfWork({
  content,
  organizationName,
}: {
  content: ScopeContent;
  organizationName: string;
}) {
  return (
    <SectionShell pageNumber={6} companyName={organizationName}>
      <SectionHeading eyebrow="Scope of Work" title={content.title} pageNumber={6} />

      <div className="overflow-x-auto rounded-2xl border border-[#e6e8ec] bg-white">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#eceef1] text-[10px] font-semibold tracking-[0.08em] text-[#9aa1ac]">
              <th className="px-5 py-3">WORKSTREAM</th>
              <th className="px-5 py-3">DELIVERABLE</th>
              <th className="px-5 py-3 text-right">INCLUDED</th>
            </tr>
          </thead>
          <tbody>
            {content.workstreams.map((row, index) => (
              <tr key={index} className="border-b border-[#f1f2f4] last:border-b-0">
                <td className="px-5 py-3.5 font-medium text-[#0a0a0c]">{row.workstream}</td>
                <td className="px-5 py-3.5 text-[#525a66]">{row.deliverable}</td>
                <td className="px-5 py-3.5 text-right text-[#525a66]">
                  {row.included ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mb-3 mt-8 text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">
        INDICATIVE TIMELINE
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {content.timeline.map((week, index) => (
          <div key={index} className="border-t-2 border-[#0a0a0c] pt-3">
            <p className="text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">
              {week.weekLabel.toUpperCase()}
            </p>
            <p className="mt-1.5 text-[14px] font-bold text-[#0a0a0c]">{week.title}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#525a66]">{week.description}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
