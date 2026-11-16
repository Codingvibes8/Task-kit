"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TaskDialog, type EditableTask } from "@/components/board/task-dialog";

export function TaskEditButton({
  task,
  projectId,
}: {
  task: EditableTask;
  projectId: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-9 px-3.5"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" />
        Edit
      </Button>
      {open ? (
        <TaskDialog
          open
          onClose={() => setOpen(false)}
          projectId={projectId}
          task={task}
        />
      ) : null}
    </>
  );
}
