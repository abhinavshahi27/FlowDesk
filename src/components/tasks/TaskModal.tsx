import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Calendar, Flag, Tag, Trash2, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  Profile,
  TaskPriority,
  TaskStatus,
  TaskWithMeta,
} from '../../lib/database.types';
import { useTasks } from '../../contexts/TaskContext';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  WORKFLOW_STATUSES,
  clsx,
  getAvatarColor,
  getInitials,
  normalizeWorkflowStatus,
} from '../../lib/utils';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type WorkflowStatus = FormData['status'];

interface Props {
  task: TaskWithMeta | null;
  projectId: string;
  members: { user_id: string; profile: Profile }[];
  onClose: () => void;
  defaultStatus?: TaskStatus;
  isAdmin: boolean;
  currentUserId?: string;
}

export default function TaskModal({
  task,
  projectId,
  members,
  onClose,
  defaultStatus,
  isAdmin,
  currentUserId,
}: Props) {
  const { createTask, updateTask, deleteTask } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isEdit = !!task;
  const canEditDetails = isAdmin;
  const canUpdateStatus = isAdmin || task?.assigned_to === currentUserId;
  const canDelete = isAdmin;
  const statusOnlyMode = isEdit && !canEditDetails && canUpdateStatus;
  const toWorkflowStatus = (status: TaskStatus): WorkflowStatus =>
    normalizeWorkflowStatus(status) as WorkflowStatus;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: toWorkflowStatus(task?.status ?? defaultStatus ?? 'todo'),
      priority: task?.priority ?? 'medium',
      due_date: task?.due_date ?? '',
      assigned_to: task?.assigned_to ?? '',
      tags: task?.tags?.join(', ') ?? '',
    },
  });

  const priorityValue = watch('priority');
  const priorityCfg = PRIORITY_CONFIG[priorityValue];

  useEffect(() => {
    reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: toWorkflowStatus(task?.status ?? defaultStatus ?? 'todo'),
      priority: task?.priority ?? 'medium',
      due_date: task?.due_date ?? '',
      assigned_to: task?.assigned_to ?? '',
      tags: task?.tags?.join(', ') ?? '',
    });
  }, [task, reset, defaultStatus]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!isAdmin && !canUpdateStatus) {
      toast.error('You can only update tasks assigned to you');
      return;
    }

    setIsSubmitting(true);
    const tags = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = isAdmin
      ? {
          title: data.title,
          description: data.description || '',
          status: data.status as TaskStatus,
          priority: data.priority as TaskPriority,
          due_date: data.due_date || null,
          assigned_to: data.assigned_to || null,
          tags,
          project_id: projectId,
        }
      : {
          status: data.status as TaskStatus,
          project_id: projectId,
        };

    if (isEdit && task) {
      await updateTask(task.id, payload);
      toast.success('Task updated');
    } else if (isAdmin) {
      const created = await createTask(payload);
      if (created) toast.success('Task created');
    } else {
      toast.error('Only admins can create tasks');
    }
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!canDelete) {
      toast.error('Only admins can delete tasks');
      return;
    }
    await deleteTask(task.id);
    toast.success('Task deleted');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-elevated shadow-glow-strong"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
          <header className="flex items-center justify-between border-b border-border px-6 pb-4 pt-5">
            <div className="flex items-center gap-2.5">
              <span
                className={clsx(
                  'flex h-9 w-9 items-center justify-center rounded-xl ring-1',
                  priorityCfg.bg,
                  priorityCfg.text,
                  priorityCfg.ring
                )}
              >
                <Flag size={15} />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight text-ink">
                  {isEdit ? 'Edit task' : 'New task'}
                </h2>
                <p className="text-[11px] text-muted">
                  {statusOnlyMode ? 'Members can update the status of their tasks.' : 'Configure scope, owner, and timing.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-ink"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
            <div>
              <input
                {...register('title')}
                type="text"
                placeholder="What needs to happen?"
                disabled={!canEditDetails}
                className="w-full bg-transparent text-base font-semibold text-ink placeholder-dim outline-none disabled:opacity-70"
                autoFocus={!isEdit}
              />
              {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
            </div>

            <div>
              <textarea
                {...register('description')}
                placeholder="Add details, links, or acceptance criteria…"
                rows={3}
                disabled={!canEditDetails}
                className="w-full resize-none rounded-2xl border border-border bg-bg-soft px-3.5 py-2.5 text-sm text-ink placeholder-dim outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/20 disabled:opacity-70"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModalField icon={<Flag size={11} />} label="Status">
                <select
                  {...register('status')}
                  disabled={!canUpdateStatus}
                  className="modal-input"
                >
                  {WORKFLOW_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </ModalField>

              <ModalField icon={<AlertTriangle size={11} />} label="Priority">
                <select
                  {...register('priority')}
                  disabled={!canEditDetails}
                  className="modal-input"
                >
                  {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_CONFIG[p].label}
                    </option>
                  ))}
                </select>
              </ModalField>

              <ModalField icon={<Calendar size={11} />} label="Due date">
                <input
                  {...register('due_date')}
                  type="date"
                  disabled={!canEditDetails}
                  className="modal-input"
                />
              </ModalField>

              <ModalField icon={<User size={11} />} label="Assignee">
                <select
                  {...register('assigned_to')}
                  disabled={!canEditDetails}
                  className="modal-input"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile.full_name || m.profile.email}
                    </option>
                  ))}
                </select>
              </ModalField>
            </div>

            <ModalField icon={<Tag size={11} />} label="Tags">
              <input
                {...register('tags')}
                type="text"
                placeholder="design, frontend, bug (comma separated)"
                disabled={!canEditDetails}
                className="modal-input"
              />
            </ModalField>

            {task?.assignee && (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-bg-soft px-3 py-2.5 text-xs text-muted">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-on-accent"
                  style={{ backgroundColor: getAvatarColor(task.assignee.full_name) }}
                >
                  {getInitials(task.assignee.full_name)}
                </div>
                Assigned to <span className="font-semibold text-ink">{task.assignee.full_name}</span>
              </div>
            )}

            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
                >
                  <p className="mb-3 text-xs">
                    Are you sure you want to delete this task? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      Delete task
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 border-t border-border pt-4">
              {isEdit && canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg p-2 text-dim transition hover:bg-danger/10 hover:text-danger"
                  title="Delete task"
                >
                  <Trash2 size={15} />
                </button>
              )}
              {statusOnlyMode && (
                <p className="text-[11px] text-muted">Members can update the status of their tasks.</p>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (isEdit && !isDirty) || (!isAdmin && !canUpdateStatus)}
                className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/70 border-t-transparent" />
                ) : isEdit ? (
                  'Save changes'
                ) : (
                  'Create task'
                )}
              </button>
            </div>
          </form>

          <style>{`
            .modal-input {
              width: 100%;
              background: rgb(var(--bg-soft));
              border: 1px solid rgb(var(--border));
              border-radius: 12px;
              padding: 8px 12px;
              font-size: 13px;
              color: rgb(var(--text));
              transition: border-color 120ms ease, box-shadow 120ms ease;
            }
            .modal-input:focus {
              outline: none;
              border-color: rgb(var(--accent));
              box-shadow: 0 0 0 3px rgb(var(--accent) / 0.18);
            }
            .modal-input:disabled {
              opacity: 0.65;
              cursor: not-allowed;
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModalField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
