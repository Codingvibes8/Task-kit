"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/board/task-dialog";

export function NewTaskButton({
  projectId,
  label = "New task",
}: {
  projectId?: string | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" className="h-9 px-3.5" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        {label}
      </Button>
      {open ? (
        <TaskDialog
          open
          onClose={() => setOpen(false)}
          projectId={projectId ?? null}
        />
      ) : null}
    </>
  );
}
