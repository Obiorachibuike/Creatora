"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export interface Track {
  id: string;
  name: string;
  trackType: string;
  order: number;
}
export interface Clip {
  id: string;
  trackId: string | null;
  assetId?: string | null;
  generationId?: string | null;
  startTime: number;
  duration: number;
  order: number;
  opacity: number;
  text?: string | null;
  voiceoverId?: string | null;
  transitions?: string[] | null;
}

interface Props {
  projectId: string;
  tracks: Track[];
  clips: Clip[];
}

export function EditorClient({ projectId, tracks, clips }: Props) {
  const [t, setT] = useState<Track[]>(tracks);
  const [c, setC] = useState<Clip[]>(clips);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const selected = c.find((x) => x.id === selectedId) ?? null;

  const save = useCallback(
    async (tracksPayload: Track[], clipsPayload: Clip[]) => {
      setAutosaving(true);
      try {
        await fetch(`/api/projects/${projectId}/timeline`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracks: tracksPayload, clips: clipsPayload }),
        });
        setSavedAt(new Date());
      } finally {
        setAutosaving(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    const id = setTimeout(() => void save(t, c), 800);
    return () => clearTimeout(id);
  }, [t, c, save]);

  const addTrack = (trackType: string) => {
    const track: Track = {
      id: crypto.randomUUID(),
      name: `${trackType.charAt(0).toUpperCase()}${trackType.slice(1)} ${t.length + 1}`,
      trackType,
      order: t.length,
    };
    setT([...t, track]);
  };

  const addClip = (trackId: string) => {
    const clip: Clip = {
      id: crypto.randomUUID(),
      trackId: trackId || null,
      assetId: undefined,
      generationId: undefined,
      startTime: c
        .filter((x) => x.trackId === trackId)
        .reduce((m, x) => Math.max(m, x.startTime + x.duration), 0),
      duration: 10,
      order: c.length,
      opacity: 1,
    };
    setC([...c, clip]);
  };

  const moveClip = (id: string, delta: number) => {
    setC(c.map((x) => (x.id === id ? { ...x, startTime: x.startTime + delta } : x)));
  };

  const trimClip = (id: string, minDur = 2) => {
    setC(c.map((x) => (x.id === id && x.duration + 2 >= minDur ? { ...x, duration: x.duration + 2 } : x)));
  };

  const setOpacity = (id: string, opacity: number) => {
    setC(c.map((x) => (x.id === id ? { ...x, opacity } : x)));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Tracks</CardTitle>
          <CardDescription>Video · Audio · Image · Text · Overlay</CardDescription>
        </CardHeader>
        <div className="space-y-2">
          {t.map((track) => (
            <div key={track.id} className="rounded-lg border border-(--border) p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{track.name}</span>
                <Badge>{track.trackType}</Badge>
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => addClip(track.id)}>
                Add clip
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addTrack("video")}>+ Video</Button>
            <Button variant="outline" size="sm" onClick={() => addTrack("audio")}>+ Audio</Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clips</CardTitle>
          <CardDescription>
            {c.length} clip(s) · autosave {savedAt ? `at ${savedAt.toLocaleTimeString()}` : "off"}
          </CardDescription>
        </CardHeader>
        <div className="space-y-2">
          {c.map((clip) => (
            <div
              key={clip.id}
              className={`cursor-pointer rounded-lg border p-3 ${
                selectedId === clip.id ? "border-(--brand-primary)" : "border-(--border)"
              }`}
              onClick={() => setSelectedId(clip.id)}
            >
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => moveClip(clip.id, -2)}>◀</Button>
                <span className="text-sm font-medium">{clip.text || "Clip " + clip.id.slice(0, 4)}</span>
                <Button size="sm" variant="outline" onClick={() => moveClip(clip.id, 2)}>▶</Button>
                <Button size="sm" variant="outline" onClick={() => trimClip(clip.id)}>+2s</Button>
              </div>
              <div className="mt-1 text-xs text-(--foreground-muted)">
                start {clip.startTime.toFixed(1)}s · dur {clip.duration.toFixed(1)}s · opacity {clip.opacity}
              </div>
            </div>
          ))}
          {c.length === 0 && <p className="text-sm text-(--foreground-muted)">No clips — add one above.</p>}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Selected clip</CardDescription>
        </CardHeader>
        {selected ? (
          <div>
            {selected.generationId && <p className="text-sm">Generation {selected.generationId.slice(0, 8)}</p>}
            {selected.text && <p className="text-sm">Text: {selected.text}</p>}
            <label className="mt-2 block text-xs">Opacity {selected.opacity.toFixed(1)}</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selected.opacity}
              onChange={(e) => setOpacity(selected.id, Number(e.target.value))}
              className="mt-1 w-full accent-(--brand-primary)"
            />
          </div>
        ) : (
          <p className="text-sm text-(--foreground-muted)">Select a clip to edit.</p>
        )}
        <p className="mt-2 text-xs text-(--foreground-muted)">{autosaving ? "Saving…" : "Saved"}</p>
      </Card>
    </div>
  );
}
