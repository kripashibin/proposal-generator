import { MutedCard, SectionHeading, SectionShell } from "./shared";
import type { TeamContent } from "@/lib/proposal/content-schema";

export function Team({
  content,
  organizationName,
  teamMembers,
}: {
  content: TeamContent;
  organizationName: string;
  teamMembers: { name: string; role: string | null; description: string | null }[];
}) {
  return (
    <SectionShell pageNumber={7} companyName={organizationName}>
      <SectionHeading eyebrow="Team" title={content.title} pageNumber={7} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {teamMembers.map((member, index) => (
          <div key={index} className="rounded-2xl border border-[#e6e8ec] bg-white p-5">
            <p className="text-[15px] font-bold text-[#0a0a0c]">
              {member.name}
              {member.role ? <span className="font-normal text-[#525a66]"> — {member.role}</span> : null}
            </p>
            {member.description ? (
              <p className="mt-2 text-sm leading-relaxed text-[#525a66]">{member.description}</p>
            ) : null}
          </div>
        ))}
      </div>

      <MutedCard className="mt-6">
        <p className="text-[14px] font-bold text-[#0a0a0c]">{content.workingModelTitle}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#5b6270]">{content.workingModelBody}</p>
      </MutedCard>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">
            COMMUNICATION
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#525a66]">{content.communication}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">
            DOCUMENTATION
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#525a66]">{content.documentation}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">SUPPORT</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#525a66]">{content.support}</p>
        </div>
      </div>
    </SectionShell>
  );
}
