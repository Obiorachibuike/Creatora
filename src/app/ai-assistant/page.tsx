"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const ACTIONS = [
  { label: "Generate video", kind: "video", hint: "Turn a prompt into a video asset" },
  { label: "Generate image", kind: "image", hint: "Turn a prompt into an image asset" },
  { label: "Write script", kind: "script", hint: "Structure a prompt into scenes + narration" },
  { label: "Generate storyboard", kind: "storyboard", hint: "Build shot descriptions and scene images" },
] as const;

export default function AiAssistantPage() {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ action: string; id: string; url: string } | null>(null);

  async function handleAction(action: string) {
    if (!prompt.trim()) {
      setError("Describe what you want first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: action === "video" ? "video" : "image", prompt }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "generation_failed");
      else setResult({ action, id: data.generation.id, url: data.asset.url });
    } catch {
      setError("Network error.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">AI Creative Assistant</h1>
        <p className="text-sm text-(--foreground-muted)">
          Ask us to create things; we run real operations through structured, validated tool calls.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ask for a creation</CardTitle>
          <CardDescription>
            Example: “Create a video of a luxury watch ad” or “Generate an image of a cat in a jazz bar.”
          </CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm text-(--foreground) outline-none focus:border-(--brand-primary)"
            placeholder="Describe what you want to create…"
          />
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant="outline"
                onClick={() => handleAction(a.kind)}
                disabled={busy}
              >
                {busy ? "Running…" : a.label}
              </Button>
            ))}
          </div>
          {error && <Badge variant="red" className="w-fit">{error}</Badge>}
          {result && (
            <div className="flex items-center gap-3">
              <Badge variant="green">{result.action} started</Badge>
              <Link href={`/api/generations/${result.id}`} className="text-sm text-(--brand-primary)" target="_blank" rel="noreferrer">
                View status →
              </Link>
              {result.url && <video src={result.url} className="h-32 rounded border border-(--border)" />}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
