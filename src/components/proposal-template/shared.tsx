import type { ReactNode } from "react";

// Shared visual chrome for the public proposal template, matching
// proposal-template.pdf: light page background, navy headings, pale-blue
// oversized section numbers, white bordered cards, and a consistent
// header/footer repeated per section (evoking separate PDF pages while
// remaining a single scrolling web page).

export function PageHeader({ companyName }: { companyName: string }) {
  return (
    <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4 text-[11px] sm:px-10">
      <span className="font-semibold tracking-wide text-[#0a0a0c]">
        {companyName.toUpperCase()}
      </span>
      <span className="text-[#9aa1ac]">Confidential Proposal</span>
    </div>
  );
}

export function PageFooter({ pageNumber }: { pageNumber: number }) {
  return (
    <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4 text-[11px] text-[#b3b9c2] sm:px-10">
      <span>Proposal</span>
      <span>{String(pageNumber).padStart(2, "0")}</span>
    </div>
  );
}

export function SectionShell({
  pageNumber,
  companyName,
  children,
  className = "",
}: {
  pageNumber: number;
  companyName: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-[#eceef1] bg-[#f7f8fa] first:border-t-0 ${className}`}>
      <PageHeader companyName={companyName} />
      <div className="mx-auto max-w-[900px] px-6 pb-14 pt-2 sm:px-10">{children}</div>
      <PageFooter pageNumber={pageNumber} />
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  pageNumber,
}: {
  eyebrow: string;
  title: string;
  pageNumber: number;
}) {
  return (
    <div className="relative mb-8 mt-6">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-4 right-0 select-none text-[64px] font-bold leading-none text-[#dbeafe] sm:text-[88px]"
      >
        {String(pageNumber).padStart(2, "0")}
      </span>
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#6b7280]">
        {eyebrow.toUpperCase()}
      </p>
      <h2 className="mt-2 max-w-[70%] text-[28px] font-bold leading-tight text-[#0a0a0c] sm:text-[34px]">
        {title}
      </h2>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#e6e8ec] bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

export function MutedCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#e6e8ec] bg-[#f2f3f5] p-5 ${className}`}>
      {children}
    </div>
  );
}

export function DarkCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-[#0a0a0c] p-5 text-white ${className}`}>{children}</div>
  );
}

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.1em] text-[#9aa1ac]">
      {typeof children === "string" ? children.toUpperCase() : children}
    </p>
  );
}
