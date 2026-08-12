"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionEditor, type JsonValue } from "@/components/dashboard/section-editor";
import { updateProposalContentSection, publishProposal } from "@/lib/proposal/actions";
import { SECTION_ORDER, type SectionKey } from "@/lib/proposal/content-schema";

const SECTION_LABEL: Record<SectionKey, string> = {
  cover: "Cover",
  executive_summary: "Executive Summary",
  challenges: "Current Challenges",
  solution: "Proposed Solution",
  why_us: "Why Us",
  scope: "Scope of Work",
  team: "Team",
  investment: "Investment",
  agreement: "Agreement & Next Steps",
};

interface ContentRow {
  section_key: SectionKey;
  content: JsonValue;
}

export function ReviewEditor({
  proposalId,
  initialContent,
}: {
  proposalId: string;
  initialContent: ContentRow[];
}) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();
  const [isPublishing, startPublishing] = useTransition();
  const [sectionValues, setSectionValues] = useState<Partial<Record<SectionKey, JsonValue>>>(
    Object.fromEntries(initialContent.map((row) => [row.section_key, row.content])),
  );
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<SectionKey | null>(null);

  const hasContent = Object.keys(sectionValues).length > 0;

  function generateAll() {
    startGenerating(async () => {
      try {
        const res = await fetch(`/api/proposals/${proposalId}/generate`, { method: "POST" });
        const responseBody = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(responseBody.error ?? "Generation failed");
        }
        setSectionValues((prev) => ({ ...prev, ...responseBody.content }));
        toast.success("Draft generated");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Generation failed");
      }
    });
  }

  async function regenerateSection(section: SectionKey) {
    setRegeneratingSection(section);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: [section] }),
      });
      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseBody.error ?? "Regeneration failed");
      }
      setSectionValues((prev) => ({ ...prev, ...responseBody.content }));
      toast.success(`${SECTION_LABEL[section]} regenerated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegeneratingSection(null);
    }
  }

  async function saveSection(section: SectionKey) {
    const content = sectionValues[section];
    if (!content) return;
    setSavingSection(section);
    try {
      await updateProposalContentSection(proposalId, section, content as Record<string, unknown>);
      toast.success(`${SECTION_LABEL[section]} saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingSection(null);
    }
  }

  function handlePublish() {
    startPublishing(async () => {
      try {
        await publishProposal(proposalId);
        toast.success("Proposal published");
        router.push(`/proposals/${proposalId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to publish");
      }
    });
  }

  if (!hasContent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No content yet</p>
            <p className="text-sm text-muted-foreground">
              Generate the full proposal narrative from your brief description.
            </p>
          </div>
          <Button onClick={generateAll} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? "Generating…" : "Generate with AI"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {SECTION_ORDER.filter((section) => sectionValues[section]).map((section) => (
        <Card key={section}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{SECTION_LABEL[section]}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => regenerateSection(section)}
                disabled={regeneratingSection === section}
              >
                {regeneratingSection === section ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => saveSection(section)}
                disabled={savingSection === section}
              >
                {savingSection === section ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SectionEditor
              value={sectionValues[section]!}
              onChange={(next) => setSectionValues((prev) => ({ ...prev, [section]: next }))}
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={generateAll} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Regenerate all
        </Button>
        <Button onClick={handlePublish} disabled={isPublishing}>
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPublishing ? "Publishing…" : "Publish proposal"}
        </Button>
      </div>
    </div>
  );
}
