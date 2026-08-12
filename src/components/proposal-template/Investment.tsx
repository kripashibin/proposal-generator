import { MutedCard, SectionHeading, SectionShell } from "./shared";
import type { InvestmentContent } from "@/lib/proposal/content-schema";
import { formatCents } from "@/lib/proposal/money";

export function Investment({
  content,
  organizationName,
  currency,
  lineItems,
  totalCents,
  amountDueCents,
  paymentType,
}: {
  content: InvestmentContent;
  organizationName: string;
  currency: string;
  lineItems: { itemName: string; description: string | null; amountCents: number }[];
  totalCents: number;
  amountDueCents: number;
  paymentType: "full" | "deposit" | "custom";
}) {
  return (
    <SectionShell pageNumber={8} companyName={organizationName}>
      <SectionHeading eyebrow="Investment" title={content.title} pageNumber={8} />

      <div className="overflow-x-auto rounded-2xl border border-[#e6e8ec] bg-white">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#eceef1] text-[10px] font-semibold tracking-[0.08em] text-[#9aa1ac]">
              <th className="px-5 py-3">ITEM</th>
              <th className="px-5 py-3">DESCRIPTION</th>
              <th className="px-5 py-3 text-right">INVESTMENT</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={index} className="border-b border-[#f1f2f4]">
                <td className="px-5 py-3.5 font-medium text-[#0a0a0c]">{item.itemName}</td>
                <td className="px-5 py-3.5 text-[#525a66]">{item.description}</td>
                <td className="px-5 py-3.5 text-right text-[#525a66]">
                  {formatCents(item.amountCents, currency)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#0a0a0c]">
              <td className="px-5 py-3.5 text-[15px] font-bold text-[#0a0a0c]" colSpan={2}>
                Total project investment
              </td>
              <td className="px-5 py-3.5 text-right text-[15px] font-bold text-[#0a0a0c]">
                {formatCents(totalCents, currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {amountDueCents !== totalCents ? (
        <p className="mt-3 text-sm font-medium text-[#0a0a0c]">
          {paymentType === "deposit" ? "Deposit" : "Amount"} due at signing:{" "}
          {formatCents(amountDueCents, currency)}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MutedCard>
          <p className="text-[14px] font-bold text-[#0a0a0c]">Payment schedule</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5b6270]">
            {content.paymentScheduleText}
          </p>
        </MutedCard>
        <MutedCard>
          <p className="text-[14px] font-bold text-[#0a0a0c]">Optional ongoing support</p>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5b6270]">
            {content.optionalSupportText}
          </p>
        </MutedCard>
      </div>

      <p className="mt-6 text-xs text-[#9aa1ac]">{content.disclaimerText}</p>
    </SectionShell>
  );
}
