import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, CheckSquare, ExternalLink, Layers, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Task, TaskPriority, TaskStatus } from '../lib/database.types';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  WORKFLOW_STATUSES,
  clsx,
  formatDate,
  isOverdue,
  normalizeWorkflowStatus,
} from '../lib/utils';
import AnimatedCounter from '../components/ui/AnimatedCounter';

interface TaskWithProject extends Task {
  project?: { id: string; name: string; color: string } | null;
}

export default function MyTasksPage() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('tasks')
        .select('*, project:projects(id, name, color)')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      setTasks((data as TaskWithProject[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus && normalizeWorkflowStatus(t.status) !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority]);

  const grouped = useMemo(() => {
    const overdue = filtered.filter((t) => isOverdue(t.due_date) && t.status !== 'done');
    const upcoming = filtered.filter((t) => !isOverdue(t.due_date) && t.status !== 'done');
    const done = filtered.filter((t) => t.status === 'done');
    return { overdue, upcoming, done };
  }, [filtered]);

  const openCount = tasks.filter((t) => t.status !== 'done').length;
  const doneCount = tasks.length - openCount;
  const firstName = (profile?.full_name || 'there').split(' ')[0];

  return (
    <div className="space-y-6 p-5 lg:p-7">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6"
      >
        <span className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              <Sparkles size={12} /> Focus mode
            </span>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Today&rsquo;s queue for {firstName}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted">
              Pull just the work assigned to you — sorted by due date — so you can ship without context switching.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatChip label="Open" value={openCount} tone="accent" />
            <StatChip label="Overdue" value={grouped.overdue.length} tone={grouped.overdue.length > 0 ? 'danger' : 'muted'} />
            <StatChip label="Shipped" value={doneCount} tone="success" />
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink outline-none transition focus:border-accent/40"
        >
          <option value="">All statuses</option>
          {WORKFLOW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink outline-none transition focus:border-accent/40"
        >
          <option value="">All priorities</option>
          {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_CONFIG[p].label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface py-20 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success ring-1 ring-success/30">
            <CheckSquare size={24} />
          </span>
          <h3 className="font-display text-lg font-semibold text-ink">You&rsquo;re all caught up</h3>
          <p className="mt-1 max-w-sm text-xs text-muted">
            Nothing assigned to you right now. Take a breath — or go review a teammate&rsquo;s work.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.overdue.length > 0 && (
            <Section title="Overdue" icon={<AlertTriangle size={13} />} tone="danger" tasks={grouped.overdue} />
          )}
          {grouped.upcoming.length > 0 && (
            <Section title="Upcoming" icon={<Calendar size={13} />} tone="accent" tasks={grouped.upcoming} />
          )}
          {grouped.done.length > 0 && (
            <Section title="Completed" icon={<CheckSquare size={13} />} tone="success" tasks={grouped.done} />
          )}
        </div>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'accent' | 'danger' | 'success' | 'muted';
}) {
  const toneMap: Record<string, string> = {
    accent: 'border-accent/30 bg-accent/10 text-accent',
    danger: 'border-danger/30 bg-danger/10 text-danger',
    success: 'border-success/30 bg-success/10 text-success',
    muted: 'border-border bg-surface-2 text-muted',
  };
  return (
    <div
      className={clsx(
        'flex min-w-[110px] flex-col gap-0.5 rounded-2xl border px-3 py-2 text-left',
        toneMap[tone]
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{label}</span>
      <span className="font-display text-xl font-semibold">
        <AnimatedCounter value={value} />
      </span>
    </div>
  );
}

function Section({
  title,
  icon,
  tone,
  tasks,
}: {
  title: string;
  icon: React.ReactNode;
  tone: 'accent' | 'danger' | 'success';
  tasks: TaskWithProject[];
}) {
  const toneMap: Record<string, string> = {
    accent: 'text-accent',
    danger: 'text-danger',
    success: 'text-success',
  };
  return (
    <section>
      <h2 className={clsx('mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]', toneMap[tone])}>
        {icon}
        {title}
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">{tasks.length}</span>
      </h2>
      <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
        {tasks.map((task, i) => {
          const priority = PRIORITY_CONFIG[task.priority];
          const status = STATUS_CONFIG[normalizeWorkflowStatus(task.status)];
          const overdue = isOverdue(task.due_date) && task.status !== 'done';
          return (
            <li
              key={task.id}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2',
                i < tasks.length - 1 && 'border-b border-border'
              )}
            >
              <span className={clsx('h-7 w-1 shrink-0 rounded-full', priority.dot)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                {task.project && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-dim">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                    <Layers size={10} />
                    <span className="truncate">{task.project.name}</span>
                  </div>
                )}
              </div>
              {task.due_date && (
                <span
                  className={clsx(
                    'hidden whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex sm:items-center sm:gap-1',
                    overdue
                      ? 'bg-danger/15 text-danger ring-1 ring-danger/30'
                      : 'bg-surface-2 text-muted ring-1 ring-border'
                  )}
                >
                  <Calendar size={10} />
                  {formatDate(task.due_date)}
                </span>
              )}
              <span
                className={clsx(
                  'whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                  status.text,
                  status.bg,
                  status.border
                )}
              >
                {status.label}
              </span>
              {task.project && (
                <Link
                  to={`/projects/${task.project.id}`}
                  className="text-dim transition hover:text-accent"
                  title="Open project"
                >
                  <ExternalLink size={13} />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
