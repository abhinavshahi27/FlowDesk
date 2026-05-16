import { memo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Calendar, MessageSquare, Sparkles } from 'lucide-react';
import type { TaskWithMeta } from '../../lib/database.types';
import {
  PRIORITY_CONFIG,
  formatDate,
  isOverdue,
  getInitials,
  getAvatarColor,
  clsx,
} from '../../lib/utils';

interface Props {
  task: TaskWithMeta;
  index: number;
  onClick: (task: TaskWithMeta) => void;
  isDragDisabled?: boolean;
}

function TaskCardInner({ task, index, onClick, isDragDisabled = false }: Props) {
  const priority = PRIORITY_CONFIG[task.priority];
  const overdue = isOverdue(task.due_date);

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={clsx(
            'group relative overflow-hidden rounded-2xl border p-3.5 transition-all duration-200',
            snapshot.isDragging
              ? 'rotate-1 border-accent/60 bg-elevated shadow-glow-strong'
              : overdue
              ? 'border-danger/40 bg-danger/5 hover:border-danger/60'
              : 'border-border bg-surface hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow',
            isDragDisabled ? 'cursor-default opacity-80' : 'cursor-pointer'
          )}
        >
          <span className={clsx('absolute inset-y-3 left-0 w-1 rounded-r-full', priority.dot)} />
          <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />

          <div className="relative mb-3 flex flex-wrap items-center gap-1.5 pl-1.5">
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1',
                priority.text,
                priority.bg,
                priority.ring
              )}
            >
              <span
                className={clsx(
                  'h-1.5 w-1.5 rounded-full',
                  priority.dot,
                  task.priority === 'urgent' && 'animate-pulse'
                )}
              />
              {priority.label}
            </span>
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted"
              >
                #{tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-dim">
                +{task.tags.length - 2}
              </span>
            )}
          </div>

          <p className="relative mb-2 line-clamp-2 pl-1.5 text-sm font-semibold leading-snug text-ink">
            {task.title}
          </p>

          {task.description && (
            <p className="relative mb-3 line-clamp-2 pl-1.5 text-xs leading-relaxed text-muted">
              {task.description}
            </p>
          )}

          <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
            <div className="flex items-center gap-2">
              {task.due_date && (
                <span
                  className={clsx(
                    'flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ring-1',
                    overdue
                      ? 'bg-danger/15 text-danger ring-danger/30'
                      : 'bg-surface-2 text-muted ring-border'
                  )}
                >
                  <Calendar size={10} />
                  {formatDate(task.due_date)}
                </span>
              )}
              {task.description && (
                <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-[10px] text-dim ring-1 ring-border">
                  <MessageSquare size={10} />
                  Notes
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {task.priority === 'urgent' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/15 text-danger animate-icon-pop">
                  <Sparkles size={10} />
                </span>
              )}
              {task.assignee ? (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-on-accent ring-2 ring-surface"
                  style={{ backgroundColor: getAvatarColor(task.assignee.full_name) }}
                  title={task.assignee.full_name}
                >
                  {getInitials(task.assignee.full_name)}
                </div>
              ) : (
                <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-dim">
                  Unassigned
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export const TaskCard = memo(TaskCardInner);
