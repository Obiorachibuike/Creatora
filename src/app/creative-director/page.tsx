"use client";

import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

export default function CreativeDirectorPage() {
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/director", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "director_failed");
    else setSteps(data.steps ?? []);
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">AI Creative Director</h1>
        <p className="text-sm text-(--foreground-muted)">
          Give a brief — the system breaks it into scenes, generates storyboards, videos and narration.
        </p>
      </div>
      <Card className="space-y-4">
        <CardHeader><CardTitle>Create an ad from a brief</CardTitle><CardDescription>Example: “Create a 30-second luxury wristwatch advertisement.”</CardDescription></CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label>Brief</Label>
          <Input
            required
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Luxury watch ad — 30 seconds"
          />
          <Button type="submit" disabled={busy}>{busy ? "Directing…" : "Direct & generate"}</Button>
          {error && <Badge variant="red" className="w-fit">{error}</Badge>}
        </form>
        {steps.length > 0 && (
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-(--border) px-3 py-2 text-sm">
                <span className="text-(--foreground-muted)">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
