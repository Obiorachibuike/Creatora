"use client";

import { useState } from "react";
import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function NewProjectDialog({ onClose }: { onClose?: () => void }) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const result = await createProject(new FormData(e.currentTarget));
    if (result.ok && result.projectId) {
      window.location.href = `/projects/${result.projectId}`;
    } else {
      setError(result.error === "name_required" ? "Name is required." : "Could not create project.");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-(--border) bg-(--surface-elevated) p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label>Project name</Label>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Camp Ads"
          />
          {error && <p className="text-sm text-(--error)">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create project"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
