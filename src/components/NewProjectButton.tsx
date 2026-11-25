"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { NewProjectDialog } from "@/components/NewProjectDialog";

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>+ New Project</Button>
      {open && <NewProjectDialog onClose={() => setOpen(false)} />}
    </>
  );
}
