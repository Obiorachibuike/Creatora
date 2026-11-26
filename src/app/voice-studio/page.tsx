"use client";

import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";

export default function VoiceStudioPage() {
  const [text, setText] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const [language, setLanguage] = useState("en");
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
      body: JSON.stringify({ kind: "audio", prompt: text, voice: voiceName, language }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error === "insufficient_credits" ? "Out of credits." : data.error ?? "tts_failed");
    else setResult({ id: data.generation.id, url: data.asset.url });
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">AI Voice Studio</h1>
        <p className="text-sm text-(--foreground-muted)">Text-to-speech, voice cloning (authorized), multiple languages.</p>
      </div>
      <Card className="space-y-4">
        <CardHeader><CardTitle>Text-to-speech</CardTitle><CardDescription>Generate narration or voiceover.</CardDescription></CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Text</Label>
            <Input
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hello, welcome to Creatora!"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Voice name (optional)</Label>
              <Input value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="e.g. calm-narrator" />
            </div>
            <div>
              <Label>Language</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en, es, fr, hi…" />
            </div>
          </div>
          {error && <Badge variant="red" className="w-fit">{error}</Badge>}
          <Button type="submit" disabled={busy}>{busy ? "Generating…" : "Generate speech"}</Button>
          {result?.url && (
            <audio src={result.url} controls className="w-full" />
          )}
        </form>
        <div className="pt-4 border-t border-(--border) text-xs text-(--foreground-muted)">
          Voice cloning: authorized voice cloning is supported for use cases like name + use_case “characters”. Uploads require client credentials approval; see Providers in the Admin panel.
        </div>
      </Card>
    </div>
  );
}
