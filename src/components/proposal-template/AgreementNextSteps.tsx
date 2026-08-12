import type { ReactNode } from "react";
import { Card, DarkCard, SectionHeading, SectionShell } from "./shared";
import type { AgreementContent } from "@/lib/proposal/content-schema";

export function AgreementNextSteps({
  content,
  organizationName,
  sentDate,
  contactEmail,
  contactPhone,
  schedulingLink,
  signatureSlot,
}: {
  content: AgreementContent;
  organizationName: string;
  sentDate: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  schedulingLink: string | null;
  signatureSlot: ReactNode;
}) {
  const contactLine = [contactEmail, contactPhone, schedulingLink].filter(Boolean).join(" · ");

  return (
    <SectionShell pageNumber={9} companyName={organizationName}>
      <SectionHeading eyebrow="Agreement &amp; Next Steps" title={content.title} pageNumber={9} />

      <p className="max-w-[64ch] text-[15px] leading-relaxed text-[#525a66]">{content.intro}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-[14px] font-bold text-[#0a0a0c]">Commercial terms</p>
          <ol className="mt-2 space-y-1.5">
            {content.commercialTerms.map((term, index) => (
              <li key={index} className="flex gap-2 text-sm leading-relaxed text-[#525a66]">
                <span className="font-semibold text-[#0a0a0c]">{index + 1}.</span>
                {term}
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <p className="text-[14px] font-bold text-[#0a0a0c]">Next steps</p>
          <ol className="mt-2 space-y-1.5">
            {content.nextSteps.map((step, index) => (
              <li key={index} className="flex gap-2 text-sm leading-relaxed text-[#525a66]">
                <span className="font-semibold text-[#0a0a0c]">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>{signatureSlot}</div>
        <div className="border-t border-[#0a0a0c] pt-2">
          <p className="text-sm font-medium text-[#0a0a0c]">{organizationName}</p>
          <p className="mt-0.5 text-xs text-[#9aa1ac]">
            {sentDate ? new Date(sentDate).toLocaleDateString("en-US") : ""}
          </p>
          <p className="mt-1 text-xs text-[#9aa1ac]">{organizationName} / signature / date</p>
        </div>
      </div>

      <DarkCard className="mt-10">
        <p className="text-[16px] font-bold">Thank you.</p>
        <p className="mt-2 text-sm leading-relaxed text-[#c7cbd1]">{content.thankYouBody}</p>
        {contactLine ? <p className="mt-3 text-sm text-[#c7cbd1]">{contactLine}</p> : null}
      </DarkCard>
    </SectionShell>
  );
}
