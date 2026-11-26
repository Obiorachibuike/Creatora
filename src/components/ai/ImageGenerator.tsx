"use client";

import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; url: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "image", prompt, aspectRatio: aspect }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(
        data.error === "insufficient_credits"
          ? "You have run out of credits."
          : data.error ?? "generation_failed"
      );
    } else {
      setResult({ id: data.generation.id, url: data.asset.url });
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate an image</CardTitle>
        <CardDescription>From a text prompt.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Label>Prompt</Label>
        <Input
          required
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A luxury watch on a marble table at golden hour"
        />
        <div className="flex gap-2">
          <select
            value={aspect}
            onChange={(e) => setAspect(e.target.value)}
            className="h-11 w-32 rounded-lg border border-(--border) bg-(--surface-elevated) px-3 text-sm text-(--foreground)"
          >
            {["1:1", "16:9", "9:16", "4:3", "3:4"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button type="submit" className="w-40" disabled={busy}>
            {busy ? "Generating…" : "Generate"}
          </Button>
        </div>
        {error && <Badge variant="red" className="w-fit">{error}</Badge>}
        {result?.url && (
          <img
            src={result.url}
            alt="result"
            className="w-full rounded-lg border border-(--border)"
          />
        )}
      </form>
    </Card>
  );
}
