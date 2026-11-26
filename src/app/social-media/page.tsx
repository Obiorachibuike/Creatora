"use client";

import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";

const PLATFORMS = [
  { id: "youtube", name: "YouTube", ratio: "16:9", preset: "youtube" },
  { id: "youtube_shorts", name: "YouTube Shorts", ratio: "9:16", preset: "youtube_shorts" },
  { id: "tiktok", name: "TikTok", ratio: "9:16", preset: "tiktok" },
  { id: "instagram", name: "Instagram Reels", ratio: "9:16", preset: "instagram_reels" },
  { id: "facebook", name: "Facebook", ratio: "1:1", preset: "facebook" },
  { id: "linkedin", name: "LinkedIn", ratio: "16:9", preset: "linkedin" },
] as const;

export default function SocialMediaPage() {
  const [projectId, setProjectId] = useState("");
  const [platform, setPlatform] = useState<string>(PLATFORMS[0].id);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const meta = PLATFORMS.find((p) => p.id === platform) ?? PLATFORMS[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, platform: meta.id }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "export_failed");
    else setResult(data.export?.fileUrl ?? `Export created (${data.export?.id?.slice(0, 8)})`);
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Social Media Studio</h1>
        <p className="text-sm text-(--foreground-muted)">
          Repurpose exports for YouTube, TikTok, Instagram Reels, Facebook & LinkedIn.
        </p>
      </div>
      <Card className="space-y-4">
        <CardHeader><CardTitle>Create platform export</CardTitle><CardDescription>{meta.name} · aspect {meta.ratio}</CardDescription></CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Project ID</Label>
            <Input required value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="Paste a project id" />
          </div>
          <div>
            <Label>Platform</Label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-11 w-full rounded-lg border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--foreground)"
            >
              {PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.ratio})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Exporting…" : "Export for platform"}</Button>
            {result && <Badge variant="green">Done</Badge>}
            {error && <Badge variant="red">{error}</Badge>}
          </div>
        </form>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        {PLATFORMS.map((p) => (
          <div key={p.id} className="rounded-lg border border-(--border) p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              <Badge>{p.ratio}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
