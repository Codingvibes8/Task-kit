"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Loader2, Plus } from "lucide-react";

import { TaskCard } from "@/components/board/task-card";
import { TaskDialog, type EditableTask } from "@/components/board/task-dialog";
import {
  STATUS_META,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/constants";
import type { TaskCardData } from "@/db/queries/tasks";
import { moveTask } from "@/server/actions/tasks";
import { cn } from "@/lib/utils";

function byPosition(a: TaskCardData, b: TaskCardData): number {
  if (a.position !== b.position) return a.position - b.position;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function KanbanBoard({
  projectId,
  initialTasks,
  canWrite = true,
}: {
  projectId: string;
  initialTasks: TaskCardData[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    task: EditableTask | null;
    status: TaskStatus;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, TaskCardData[]>();
    for (const status of TASK_STATUSES) {
      map.set(
        status,
        tasks.filter((task) => task.status === status).sort(byPosition),
      );
    }
    return map;
  }, [tasks]);

  function openNew(status: TaskStatus = "todo") {
    setDialog({ task: null, status });
  }

  function openEdit(task: TaskCardData) {
    setDialog({ task, status: task.status });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((task) => task.id === String(active.id));
    if (!activeTask) return;

    const overId = String(over.id);
    const overTask = tasks.find((task) => task.id === overId);
    const targetStatus: TaskStatus = overId.startsWith("column:")
      ? (overId.replace("column:", "") as TaskStatus)
      : (overTask?.status ?? activeTask.status);

    const targetTasks = tasks
      .filter(
        (task) => task.status === targetStatus && task.id !== activeTask.id,
      )
      .sort(byPosition);

    let position = targetTasks.length;
    if (overTask && overTask.id !== activeTask.id) {
      const index = targetTasks.findIndex((task) => task.id === overTask.id);
      if (index >= 0) position = index;
    }

    if (activeTask.status === targetStatus && activeTask.position === position) {
      return;
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === activeTask.id
          ? { ...task, status: targetStatus, position }
          : task,
      ),
    );

    startTransition(async () => {
      const result = await moveTask({
        id: activeTask.id,
        status: targetStatus,
        position,
      });
      if (!result.ok) {
        setTasks(initialTasks);
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          {tasks.length} tasks · drag to change status
        </p>
        <div className="flex items-center gap-2">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-faint">
              <Loader2 className="size-3 animate-spin" />
              syncing
            </span>
          ) : null}
          {canWrite ? (
            <button
              type="button"
              onClick={() => openNew("todo")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[12px] font-medium text-accent-ink transition hover:bg-accent-soft"
            >
              <Plus className="size-3.5" />
              New task
            </button>
          ) : null}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {TASK_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={grouped.get(status) ?? []}
              activeId={activeId}
              canWrite={canWrite}
              onAdd={() => openNew(status)}
              onEdit={openEdit}
            />
          ))}
        </div>
      </DndContext>

      {dialog ? (
        <TaskDialog
          key={dialog.task?.id ?? `new-${dialog.status}`}
          open
          onClose={() => setDialog(null)}
          projectId={projectId}
          task={dialog.task}
          defaultStatus={dialog.status}
        />
      ) : null}
    </div>
  );
}

function BoardColumn({
  status,
  tasks,
  activeId,
  canWrite,
  onAdd,
  onEdit,
}: {
  status: TaskStatus;
  tasks: TaskCardData[];
  activeId: string | null;
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (task: TaskCardData) => void;
}) {
  const meta = STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[520px] flex-col rounded-3xl border border-line bg-surface/30 transition",
        isOver && "border-accent/40 bg-accent/[0.03]",
      )}
    >
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-3">
        <span className={cn("size-2 rounded-full", meta.dot)} />
        <h2 className="text-[12px] font-medium">{meta.label}</h2>
        <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-faint">
          {tasks.length}
        </span>
        {canWrite ? (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Add task to ${meta.label}`}
            className="ml-auto rounded-lg p-1 text-faint transition hover:bg-white/5 hover:text-ink"
          >
            <Plus className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-2 p-2.5">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={canWrite ? () => onEdit(task) : undefined}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={canWrite ? onAdd : undefined}
            className="flex h-24 w-full items-center justify-center rounded-2xl border border-dashed border-line text-[11px] text-faint transition hover:border-line-strong hover:text-muted"
          >
            {isOver ? "Drop here" : canWrite ? "+ Add the first task" : "No tasks"}
          </button>
        ) : null}

        {activeId && tasks.length > 0 ? (
          <div className="h-8 rounded-2xl border border-dashed border-accent/20 opacity-0" />
        ) : null}
      </div>
    </section>
  );
}
