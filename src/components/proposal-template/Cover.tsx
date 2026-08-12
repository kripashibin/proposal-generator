import { PageFooter, PageHeader } from "./shared";
import type { CoverContent } from "@/lib/proposal/content-schema";

export function Cover({
  content,
  eyebrowText,
  clientCompany,
  organizationName,
  proposalDate,
  validForDays,
}: {
  content: CoverContent;
  eyebrowText: string;
  clientCompany: string;
  organizationName: string;
  proposalDate: string;
  validForDays: number;
}) {
  return (
    <section className="bg-[#f7f8fa]">
      <PageHeader companyName={organizationName} />
      <div className="mx-auto max-w-[900px] px-6 pb-16 pt-10 sm:px-10 sm:pt-16">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#6b7280]">
          {eyebrowText.toUpperCase()}
        </p>
        <h1 className="mt-4 max-w-[16ch] text-[36px] font-bold leading-[1.08] text-[#0a0a0c] sm:text-[48px]">
          {content.headline}
        </h1>
        <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-[#525a66] sm:text-base">
          {content.subhead}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard label="Prepared for" value={clientCompany} />
          <InfoCard label="Prepared by" value={organizationName} />
          <InfoCard
            label="Date"
            value={new Date(proposalDate).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          />
          <InfoCard label="Proposal valid for" value={`${validForDays} days`} />
        </div>
      </div>
      <PageFooter pageNumber={1} />
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e6e8ec] bg-white px-5 py-4">
      <p className="text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">
        {label.toUpperCase()}
      </p>
      <p className="mt-1.5 text-[15px] font-bold text-[#0a0a0c]">{value}</p>
    </div>
  );
}
