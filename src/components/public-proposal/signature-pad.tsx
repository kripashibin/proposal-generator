"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signatureFont } from "@/styles/fonts";

export function SignaturePad({
  publicToken,
  onSigned,
}: {
  publicToken: string;
  onSigned: (result: { signerName: string; signedAt: string }) => void;
}) {
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  function getCanvasContext() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function pointerPos(canvas: HTMLCanvasElement, e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    drawing.current = true;
    hasDrawn.current = true;
    const { x, y } = pointerPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    const { x, y } = pointerPos(canvas, e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0a0a0c";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp() {
    drawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  }

  async function handleSubmit() {
    setError(null);
    if (!signerName.trim()) {
      setError("Please enter your full name");
      return;
    }

    let signatureData: string;
    if (mode === "typed") {
      signatureData = signerName.trim();
    } else {
      if (!hasDrawn.current || !canvasRef.current) {
        setError("Please draw your signature");
        return;
      }
      signatureData = canvasRef.current.toDataURL("image/png");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/p/${publicToken}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signerEmail: signerEmail.trim() || null,
          signatureType: mode,
          signatureData,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to submit signature");
      }
      onSigned({ signerName: signerName.trim(), signedAt: body.signedAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit signature");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-[#0a0a0c]">Client name / signature / date</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="signer-name" className="text-xs text-[#6b7280]">
            Full name
          </Label>
          <Input
            id="signer-name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signer-email" className="text-xs text-[#6b7280]">
            Email (optional)
          </Label>
          <Input
            id="signer-email"
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="jane@company.com"
          />
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "typed" | "drawn")}>
        <TabsList className="grid w-full max-w-[240px] grid-cols-2">
          <TabsTrigger value="typed">Type</TabsTrigger>
          <TabsTrigger value="drawn">Draw</TabsTrigger>
        </TabsList>
        <TabsContent value="typed">
          <div className="flex h-24 items-end rounded-md border border-[#e6e8ec] bg-white px-4 pb-2">
            <p className={`${signatureFont.className} text-[32px] leading-none text-[#0a0a0c]`}>
              {signerName || "Your name"}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="drawn">
          <div className="space-y-2">
            <canvas
              ref={canvasRef}
              width={480}
              height={140}
              className="w-full touch-none rounded-md border border-[#e6e8ec] bg-white"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            <Button type="button" variant="ghost" size="sm" onClick={clearCanvas}>
              Clear
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Signing…" : "Sign proposal"}
      </Button>
    </div>
  );
}
