import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { Plus, Sparkles } from 'lucide-react';
import type { TaskWithMeta, TaskStatus, Profile, ProjectMember } from '../../lib/database.types';
import { useTasks } from '../../contexts/TaskContext';
import { STATUS_CONFIG, WORKFLOW_STATUSES, normalizeWorkflowStatus, clsx } from '../../lib/utils';
import { TaskCard } from './TaskCard';
import TaskModal from './TaskModal';

interface Props {
  projectId: string;
  members: (ProjectMember & { profile: Profile })[];
  tasks?: TaskWithMeta[];
  currentUserId?: string;
  isAdmin: boolean;
}

const COLUMN_HELPER: Record<TaskStatus, string> = {
  backlog: 'Ideas waiting for prioritisation',
  todo: 'Ready to be picked up next',
  in_progress: 'Actively being worked on right now',
  review: 'Awaiting feedback before shipping',
  done: 'Shipped and dusted',
};

export default function KanbanBoard({
  projectId,
  members,
  tasks: visibleTasks,
  currentUserId,
  isAdmin,
}: Props) {
  const { tasks, moveTask } = useTasks();
  const [selectedTask, setSelectedTask] = useState<TaskWithMeta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  const columns = useMemo(() => {
    const boardTasks = visibleTasks ?? tasks;
    return WORKFLOW_STATUSES.reduce((acc, status) => {
      acc[status] = boardTasks
        .filter((t) => normalizeWorkflowStatus(t.status) === status)
        .sort((a, b) => a.position - b.position);
      return acc;
    }, {} as Record<TaskStatus, TaskWithMeta[]>);
  }, [tasks, visibleTasks]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const task = (visibleTasks ?? tasks).find((candidate) => candidate.id === draggableId);
    if (!task || (!isAdmin && task.assigned_to !== currentUserId)) return;

    const newStatus = destination.droppableId as TaskStatus;
    moveTask(draggableId, newStatus, destination.index);
  };

  const openNewTask = (status: TaskStatus) => {
    setSelectedTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const openEditTask = (task: TaskWithMeta) => {
    if (!isAdmin && task.assigned_to !== currentUserId) return;
    setSelectedTask(task);
    setModalOpen(true);
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-3">
          {WORKFLOW_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const colTasks = columns[status] ?? [];
            return (
              <div key={status} className="flex min-h-0 flex-col">
                <header
                  className={clsx(
                    'mb-2 flex items-start justify-between gap-2 rounded-2xl border bg-surface/85 px-3 py-3',
                    config.border
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx('h-2 w-2 rounded-full', config.accent)} />
                      <h3 className={clsx('text-sm font-semibold', config.text)}>{config.label}</h3>
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                        {colTasks.length}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-dim">{COLUMN_HELPER[status]}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => openNewTask(status)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted transition hover:border-accent/40 hover:text-accent"
                      aria-label={`Add task to ${config.label}`}
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </header>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={clsx(
                        'flex-1 space-y-2.5 rounded-2xl border p-2.5 transition-colors min-h-[160px]',
                        snapshot.isDraggingOver
                          ? 'border-accent/60 bg-accent/10 ring-1 ring-accent/30'
                          : 'border-border bg-bg-soft/60'
                      )}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onClick={openEditTask}
                          isDragDisabled={!isAdmin && task.assigned_to !== currentUserId}
                        />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <EmptyColumn status={status} canCreate={isAdmin} onCreate={() => openNewTask(status)} />
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {modalOpen && (
        <TaskModal
          task={selectedTask}
          projectId={projectId}
          members={members}
          defaultStatus={defaultStatus}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onClose={() => {
            setModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
}

function EmptyColumn({
  status,
  canCreate,
  onCreate,
}: {
  status: TaskStatus;
  canCreate: boolean;
  onCreate: () => void;
}) {
  const copy: Record<TaskStatus, { title: string; hint: string }> = {
    backlog: { title: 'Capture ideas here', hint: 'Add anything that needs scoping next sprint.' },
    todo: { title: 'Ready to start', hint: 'Drag your top priority here when planning.' },
    in_progress: { title: 'Pick something up', hint: 'Move a task here when you actively start it.' },
    review: { title: 'Awaiting feedback', hint: 'Send a teammate a heads-up to review.' },
    done: { title: 'Celebrate wins', hint: 'Shipped tasks land here automatically.' },
  };
  const { title, hint } = copy[status];
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-bg-soft/40 px-3 py-6 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Sparkles size={14} />
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="max-w-[12rem] text-[11px] text-muted">{hint}</p>
      {canCreate && (
        <button
          onClick={onCreate}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/20"
        >
          <Plus size={11} /> Add task
        </button>
      )}
    </div>
  );
}
