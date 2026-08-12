"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }}
    >
      <Copy className="h-4 w-4" />
      Copy
    </Button>
  );
}
