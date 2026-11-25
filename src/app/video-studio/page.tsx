"use client";

import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:3", "21:9"] as const;
const DURATIONS = [4, 6, 8, 10, 12, 15, 20, 25, 30] as const;

const WIDTHS = ["640", "832", "960", "1024", "1280", "1920"] as const;
const HEIGHTS = ["360", "468", "544", "720", "1080"] as const;

type GenResult = { id: string; url: string; status: string };

export default function VideoStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [duration, setDuration] = useState<string>("8");
  const [width, setWidth] = useState<string>("1280");
  const [height, setHeight] = useState<string>("720");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState<GenResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setGeneration(null);
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "video",
          prompt,
          aspectRatio,
          duration: Number(duration),
          width: Number(width),
          height: Number(height),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === "insufficient_credits" ? "You have run out of credits. Upgrade your plan or top up." : (data.error ?? "generation_failed"));
      } else {
        setGeneration({ id: data.generation.id, url: data.asset.url, status: data.generation.status });
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">AI Video Studio</h1>
        <p className="text-sm text-(--foreground-muted)">Generate videos from text, images or references.</p>
      </div>

      <Card className="space-y-5">
        <CardHeader>
          <CardTitle>Text-to-video</CardTitle>
          <CardDescription>
            Describe the scene you want. We generate it with your selected provider and model.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Prompt</Label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              className="h-28 w-full rounded-lg border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm text-(--foreground) outline-none focus:border-(--brand-primary)"
              placeholder="A cinematic drone shot over a misty forest at dawn…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Aspect ratio</Label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="h-11 w-full rounded-lg border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--foreground) outline-none focus:border-(--brand-primary)"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Duration</Label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-11 w-full rounded-lg border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--foreground) outline-none focus:border-(--brand-primary)"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}s</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:col-span-2 md:grid-cols-2">
              <div>
                <Label>Width</Label>
                <select
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="h-11 w-full rounded-lg border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--foreground) outline-none focus:border-(--brand-primary)"
                >
                  {WIDTHS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Height</Label>
                <select
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="h-11 w-full rounded-lg border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--foreground) outline-none focus:border-(--brand-primary)"
                >
                  {HEIGHTS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {error && <Badge variant="red" className="w-fit">{error}</Badge>}
          <Button type="submit" className="w-full" disabled={busy || !prompt}>
            {busy ? "Generating…" : "Generate video"}
          </Button>
        </form>

        {generation && (
          <div className="space-y-3 rounded-lg border border-(--border) p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Generation · {generation.id.slice(0, 8)}</span>
              <Badge variant={generation.status === "completed" ? "green" : generation.status === "failed" ? "red" : "orange"}>
                {generation.status}
              </Badge>
            </div>
            {generation.status === "completed" && generation.url ? (
              <video
                src={generation.url}
                controls
                className="aspect-video w-full rounded-lg object-cover bg-black"
                onError={(e) => console.warn("video error", e)}
              />
            ) : (
              <p className="text-sm text-(--foreground-muted)">
                Status: {generation.status}. Poll again via GET /api/generations/{generation.id.slice(0, 8)}.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
