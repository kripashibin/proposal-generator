"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createProposal,
  updateProposalDraft,
  type ProposalFormInput,
  type ProposalLineItemInput,
  type ProposalTeamMemberInput,
} from "@/lib/proposal/actions";
import { totalAmountCents } from "@/lib/proposal/types";
import { formatCents } from "@/lib/proposal/money";
import type { TeamMember } from "@/lib/proposal/types";

const emptyLineItem: ProposalLineItemInput = { itemName: "", description: "", amountDollars: 0 };

function memberToInput(member: TeamMember): ProposalTeamMemberInput {
  return { name: member.name, role: member.role ?? "", description: member.description ?? "" };
}

export function ProposalForm({
  mode,
  proposalId,
  orgTeamMembers,
  defaultValues,
}: {
  mode: "create" | "edit";
  proposalId?: string;
  orgTeamMembers: TeamMember[];
  defaultValues?: Partial<ProposalFormInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [clientCompany, setClientCompany] = useState(defaultValues?.clientCompany ?? "");
  const [clientContactName, setClientContactName] = useState(
    defaultValues?.clientContactName ?? "",
  );
  const [clientEmail, setClientEmail] = useState(defaultValues?.clientEmail ?? "");
  const [eyebrowText, setEyebrowText] = useState(
    defaultValues?.eyebrowText ?? "GROWTH & AUTOMATION PROPOSAL",
  );
  const [proposalDate, setProposalDate] = useState(
    defaultValues?.proposalDate ?? new Date().toISOString().slice(0, 10),
  );
  const [validForDays, setValidForDays] = useState(defaultValues?.validForDays ?? 30);
  const [briefDescription, setBriefDescription] = useState(
    defaultValues?.briefDescription ?? "",
  );
  const [paymentType, setPaymentType] = useState<"full" | "deposit" | "custom">(
    defaultValues?.paymentType ?? "full",
  );
  const [amountDueDollars, setAmountDueDollars] = useState(
    defaultValues?.amountDueDollars ?? 0,
  );
  const [amountDueTouched, setAmountDueTouched] = useState(false);
  const [lineItems, setLineItems] = useState<ProposalLineItemInput[]>(
    defaultValues?.lineItems && defaultValues.lineItems.length > 0
      ? defaultValues.lineItems
      : [{ ...emptyLineItem }],
  );
  const [teamMembers, setTeamMembers] = useState<ProposalTeamMemberInput[]>(
    defaultValues?.teamMembers && defaultValues.teamMembers.length > 0
      ? defaultValues.teamMembers
      : orgTeamMembers.map(memberToInput),
  );

  const totalCents = totalAmountCents(
    lineItems.map((item) => ({ amount_cents: Math.round(item.amountDollars * 100) })),
  );
  const effectiveAmountDue =
    paymentType === "full" && !amountDueTouched ? totalCents / 100 : amountDueDollars;

  function updateLineItem(index: number, patch: Partial<ProposalLineItemInput>) {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateTeamMember(index: number, patch: Partial<ProposalTeamMemberInput>) {
    setTeamMembers((members) =>
      members.map((member, i) => (i === index ? { ...member, ...patch } : member)),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientCompany.trim()) {
      toast.error("Client / company name is required");
      return;
    }
    if (!briefDescription.trim()) {
      toast.error("Brief description is required so the AI has something to work from");
      return;
    }

    const input: ProposalFormInput = {
      clientCompany,
      clientContactName,
      clientEmail,
      eyebrowText,
      proposalDate,
      validForDays,
      briefDescription,
      paymentType,
      amountDueDollars: effectiveAmountDue,
      lineItems,
      teamMembers,
    };

    startTransition(async () => {
      try {
        if (mode === "create") {
          const { id } = await createProposal(input);
          router.push(`/proposals/${id}/review`);
        } else if (proposalId) {
          await updateProposalDraft(proposalId, input);
          router.push(`/proposals/${proposalId}`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client &amp; project</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientCompany">Client company *</Label>
            <Input
              id="clientCompany"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientContactName">Client contact name</Label>
            <Input
              id="clientContactName"
              value={clientContactName}
              onChange={(e) => setClientContactName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client email</Label>
            <Input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eyebrowText">Proposal type / eyebrow</Label>
            <Input
              id="eyebrowText"
              value={eyebrowText}
              onChange={(e) => setEyebrowText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proposalDate">Proposal date</Label>
            <Input
              id="proposalDate"
              type="date"
              value={proposalDate}
              onChange={(e) => setProposalDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validForDays">Valid for (days)</Label>
            <Input
              id="validForDays"
              type="number"
              min={1}
              value={validForDays}
              onChange={(e) => setValidForDays(Number(e.target.value) || 30)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brief description</CardTitle>
          <CardDescription>
            What is this project about? This is the only input the AI uses to write the
            narrative sections — the more context, the better the draft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={6}
            value={briefDescription}
            onChange={(e) => setBriefDescription(e.target.value)}
            placeholder="e.g. Acme Growth Labs needs faster lead response and automated follow-up. We'll build an intake + scoring workflow, automated outreach, CRM sync, and a reporting dashboard over 4 weeks..."
            required
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Line items shown in the Investment section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_140px_auto] items-start gap-2">
              <Input
                placeholder="Item name"
                value={item.itemName}
                onChange={(e) => updateLineItem(index, { itemName: e.target.value })}
              />
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateLineItem(index, { description: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={item.amountDollars || ""}
                onChange={(e) =>
                  updateLineItem(index, { amountDollars: Number(e.target.value) || 0 })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLineItems((items) => items.filter((_, i) => i !== index))}
                disabled={lineItems.length === 1}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLineItems((items) => [...items, { ...emptyLineItem }])}
          >
            <Plus className="h-4 w-4" />
            Add line item
          </Button>

          <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3 text-sm font-medium">
            <span>Total project investment</span>
            <span>{formatCents(totalCents)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Payment type</Label>
              <Select
                value={paymentType}
                onValueChange={(value) => setPaymentType(value as typeof paymentType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full amount at signing</SelectItem>
                  <SelectItem value="deposit">Deposit at signing</SelectItem>
                  <SelectItem value="custom">Custom amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountDue">Amount due now (USD)</Label>
              <Input
                id="amountDue"
                type="number"
                min={0}
                step="0.01"
                value={effectiveAmountDue || ""}
                disabled={paymentType === "full" && !amountDueTouched}
                onChange={(e) => {
                  setAmountDueTouched(true);
                  setAmountDueDollars(Number(e.target.value) || 0);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team on this proposal</CardTitle>
          <CardDescription>
            Prefilled from your Settings defaults — edit or remove per proposal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamMembers.map((member, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
              <Input
                placeholder="Name"
                value={member.name}
                onChange={(e) => updateTeamMember(index, { name: e.target.value })}
              />
              <Input
                placeholder="Role"
                value={member.role}
                onChange={(e) => updateTeamMember(index, { role: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTeamMembers((members) => members.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setTeamMembers((members) => [
                ...members,
                { name: "", role: "", description: "" },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Add team member
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Create draft & continue"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
