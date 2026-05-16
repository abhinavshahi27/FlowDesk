import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckSquare,
  FolderKanban,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users2,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import type { Task, ActivityLog, Profile, TaskPriority, TaskStatus } from '../lib/database.types';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  WORKFLOW_STATUSES,
  formatDate,
  formatRelative,
  getAvatarColor,
  getInitials,
  isOverdue,
  normalizeWorkflowStatus,
  PRODUCTIVITY_TIPS,
  SAMPLE_DASHBOARD_PROJECTS,
  SAMPLE_TEAMMATES,
  clsx,
} from '../lib/utils';
import AnimatedCounter from '../components/ui/AnimatedCounter';

interface Stats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

interface ActivityItem extends ActivityLog {
  profile?: Profile;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { projects } = useProjects();
  const [stats, setStats] = useState<Stats>({ totalProjects: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0 });
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [taskOwners, setTaskOwners] = useState<Profile[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority | ''>('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus | ''>('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const projectIds = projects.map((p) => p.id);
      const projectTasksPromise = projectIds.length
        ? supabase.from('tasks').select('*').in('project_id', projectIds)
        : Promise.resolve({ data: [] as Task[], error: null });
      const activityPromise = projectIds.length
        ? supabase
            .from('activity_log')
            .select('*, profile:profiles(*)')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [] as ActivityItem[], error: null });
      const myTasksPromise = supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .neq('status', 'done')
        .order('due_date', { ascending: true })
        .limit(6);

      const [
        { data: allTasks, error: tasksError },
        { data: activityData, error: activityError },
        { data: myTasksData, error: myTasksError },
      ] = await Promise.all([projectTasksPromise, activityPromise, myTasksPromise]);

      if (tasksError || activityError || myTasksError) {
        throw tasksError || activityError || myTasksError;
      }

      const tasks = allTasks ?? [];
      const assignedIds = Array.from(new Set(tasks.map((t) => t.assigned_to).filter(Boolean))) as string[];
      const { data: owners, error: ownersError } = assignedIds.length
        ? await supabase.from('profiles').select('*').in('id', assignedIds)
        : { data: [] as Profile[], error: null };
      if (ownersError) throw ownersError;

      const now = new Date().toISOString().split('T')[0];
      const overdue = tasks.filter((t) => t.due_date && t.due_date < now && t.status !== 'done').length;

      setStats({
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === 'done').length,
        overdueTasks: overdue,
      });

      setMyTasks(myTasksData ?? []);
      setProjectTasks(tasks);
      setTaskOwners((owners as Profile[]) ?? []);
      setActivity((activityData as ActivityItem[]) ?? []);
    } catch {
      setError('Dashboard data could not be loaded. Please refresh or try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, projects]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const productivity = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const statusData = WORKFLOW_STATUSES.map((status) => {
    const count = projectTasks.filter((t) => normalizeWorkflowStatus(t.status) === status).length;
    return {
      key: status,
      label: STATUS_CONFIG[status].label,
      count,
      pct: stats.totalTasks > 0 ? Math.round((count / stats.totalTasks) * 100) : 0,
    };
  });

  const tasksPerUser = taskOwners
    .map((owner) => ({
      id: owner.id,
      name: owner.full_name || owner.email,
      count: projectTasks.filter((task) => task.assigned_to === owner.id).length,
      color: getAvatarColor(owner.full_name || owner.email),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const projectBars = projects
    .slice(0, 6)
    .map((p) => ({
      name: p.name.length > 14 ? `${p.name.slice(0, 14)}…` : p.name,
      total: p.task_count,
      done: p.completed_count,
      color: p.color,
    }));

  const filteredMyTasks = myTasks.filter((task) => {
    const query = taskSearch.trim().toLowerCase();
    const matchesSearch = !query
      || task.title.toLowerCase().includes(query)
      || task.description.toLowerCase().includes(query)
      || task.tags.some((tag) => tag.toLowerCase().includes(query));
    const matchesPriority = !taskPriority || task.priority === taskPriority;
    const matchesStatus = !taskStatus || normalizeWorkflowStatus(task.status) === taskStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const overdueTasks = projectTasks
    .filter((t) => t.due_date && isOverdue(t.due_date) && t.status !== 'done')
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    .slice(0, 5);

  const firstName = (profile?.full_name || 'there').split(' ')[0];
  const tipIndex = Math.floor((Date.now() / (1000 * 60 * 60 * 24)) % PRODUCTIVITY_TIPS.length);
  const tip = PRODUCTIVITY_TIPS[tipIndex];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-7 p-5 lg:p-7">
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <HeroPanel
        firstName={firstName}
        productivity={productivity}
        overdueCount={stats.overdueTasks}
        totalTasks={stats.totalTasks}
        tip={tip}
      />

      {projects.length === 0 && (
        <SampleProjectsPanel onCreate={() => setShowCreate(true)} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={stats.totalProjects}
          sub={`${projects.filter((p) => p.member_count > 1).length} with teammates`}
          accentClass="from-accent to-accent-2"
          delay={0}
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks shipped"
          value={stats.completedTasks}
          sub={`of ${stats.totalTasks} total`}
          accentClass="from-success/80 to-accent"
          delay={0.05}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={stats.overdueTasks}
          sub={stats.overdueTasks > 0 ? 'Needs your eyes' : 'You are clear'}
          accentClass={stats.overdueTasks > 0 ? 'from-danger to-warning' : 'from-muted to-border-strong'}
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Completion rate"
          value={productivity}
          suffix="%"
          sub="rolling, across all projects"
          accentClass="from-accent-2 to-accent"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ProjectProgressPanel data={projectBars} />
        <TaskStatusPanel statusData={statusData} totalTasks={stats.totalTasks} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <AssignedToMePanel
          tasks={filteredMyTasks}
          totalAssigned={myTasks.length}
          search={taskSearch}
          setSearch={setTaskSearch}
          status={taskStatus}
          setStatus={setTaskStatus}
          priority={taskPriority}
          setPriority={setTaskPriority}
        />
        <TasksPerUserPanel rows={tasksPerUser} />
        <OverduePanel tasks={overdueTasks} />
      </div>

      <ActivityPanel items={activity} />

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sample workspace preview (only when user has zero real projects)           */
/* -------------------------------------------------------------------------- */

function SampleProjectsPanel({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-3xl border border-dashed border-accent/40 bg-surface/60 p-5 lg:p-6"
    >
      <span className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles size={12} /> Sample workspace preview
          </span>
          <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink">
            Here&rsquo;s how FlowDesk will feel with real projects
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            These cards aren&rsquo;t in your database — they&rsquo;re a preview that vanishes the moment you create your first real project.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="group inline-flex items-center justify-center gap-1.5 self-start rounded-xl bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong"
        >
          <Plus size={13} className="transition-transform group-hover:rotate-90" />
          Create your first project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SAMPLE_DASHBOARD_PROJECTS.map((project, index) => {
          const pct = project.task_count > 0
            ? Math.round((project.completed_count / project.task_count) * 100)
            : 0;
          return (
            <motion.article
              key={project.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-glow"
            >
              <span
                className="absolute inset-x-4 top-0 h-1 rounded-b-full"
                style={{ backgroundColor: project.color }}
              />
              <span
                className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-25 blur-2xl"
                style={{ backgroundColor: project.color }}
              />
              <div className="relative mb-3 flex items-start gap-2.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-accent shadow-glow"
                  style={{ backgroundColor: project.color }}
                >
                  <FolderKanban size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-sm font-semibold tracking-tight text-ink">
                    {project.name}
                  </h3>
                  <p className="line-clamp-2 text-[11px] text-muted">{project.description}</p>
                </div>
              </div>

              <div className="relative mb-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                  <span className="font-semibold text-ink">
                    <AnimatedCounter value={pct} suffix="%" />
                  </span>
                  <span>
                    {project.completed_count}/{project.task_count} tasks
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                </div>
              </div>

              <div className="relative flex items-center justify-between gap-2 border-t border-border pt-2.5">
                <div className="flex items-center -space-x-2">
                  {SAMPLE_TEAMMATES.slice(0, project.member_count > 3 ? 3 : project.member_count).map((teammate) => (
                    <div
                      key={teammate.name}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-on-accent ring-2 ring-surface"
                      style={{ backgroundColor: getAvatarColor(teammate.name) }}
                      title={teammate.name}
                    >
                      {getInitials(teammate.name)}
                    </div>
                  ))}
                  {project.member_count > 3 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-[10px] font-semibold text-muted ring-2 ring-surface">
                      +{project.member_count - 3}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-dim">{project.updatedHint}</span>
              </div>
            </motion.article>
          );
        })}
      </div>

      <p className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-bg-soft/60 px-3 py-1.5 text-[11px] text-muted">
        <Sparkles size={11} className="text-accent" />
        Preview only — nothing is written to your Supabase database.
      </p>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* Panels                                                                     */
/* -------------------------------------------------------------------------- */

function HeroPanel({
  firstName,
  productivity,
  overdueCount,
  totalTasks,
  tip,
}: {
  firstName: string;
  productivity: number;
  overdueCount: number;
  totalTasks: number;
  tip: string;
}) {
  const radial = [{ name: 'rate', value: productivity, fill: 'rgb(var(--accent))' }];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="relative overflow-hidden rounded-3xl border border-border bg-surface/85 p-6 shadow-soft lg:p-8"
    >
      <span className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      <span className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-accent-2/15 blur-3xl" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles size={12} /> FlowDesk overview
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Hey {firstName}, here&rsquo;s your workspace{' '}
            <span className="gradient-text">delivery pulse</span>.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Live counts from across your projects — animated as they update. {totalTasks === 0
              ? 'Spin up a project to start populating these numbers.'
              : 'Use the filters below to slice your assigned work.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Pill icon={<Target size={12} />} label={`${productivity}% completion`} tone="accent" />
            <Pill
              icon={<AlertTriangle size={12} />}
              label={overdueCount > 0 ? `${overdueCount} overdue` : 'No overdue tasks'}
              tone={overdueCount > 0 ? 'danger' : 'success'}
            />
            <Pill icon={<Wand2 size={12} />} label={tip} tone="muted" />
          </div>
        </div>

        <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: 'rgb(var(--surface-2))' }} dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-dim">Completion</p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">
              <AnimatedCounter value={productivity} suffix="%" />
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Pill({
  icon,
  label,
  tone = 'muted',
}: {
  icon: React.ReactNode;
  label: string;
  tone?: 'accent' | 'success' | 'danger' | 'muted';
}) {
  const toneMap: Record<string, string> = {
    accent: 'bg-accent/10 text-accent ring-accent/30',
    success: 'bg-success/10 text-success ring-success/30',
    danger: 'bg-danger/10 text-danger ring-danger/30',
    muted: 'bg-surface-2 text-muted ring-border',
  };
  return (
    <span
      className={clsx(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1',
        toneMap[tone]
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
  accentClass,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  sub: string;
  accentClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40"
    >
      <div className={clsx('absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r', accentClass)} />
      <span className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-accent/5 opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            <AnimatedCounter value={value} suffix={suffix} />
          </p>
          <p className="mt-2 text-xs text-muted">{sub}</p>
        </div>
        <div
          className={clsx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-on-accent shadow-glow transition group-hover:scale-110',
            accentClass
          )}
        >
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}

function ProjectProgressPanel({
  data,
}: {
  data: { name: string; total: number; done: number; color: string }[];
}) {
  return (
    <Panel
      title="Project progress"
      subtitle="Total vs completed tasks per project"
      icon={<FolderKanban size={14} />}
      className="xl:col-span-2"
    >
      {data.length === 0 ? (
        <EmptyPanel
          icon={<FolderKanban size={22} />}
          title="No projects to chart yet"
          description="Once you spin up a project and add tasks, you&rsquo;ll see live progress bars here."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-bg-soft/60 p-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} barSize={14} barGap={6}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'rgb(var(--text-dim))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgb(var(--text-dim))' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: 'rgb(var(--surface-2))' }}
                contentStyle={{
                  background: 'rgb(var(--elevated))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'rgb(var(--text))',
                }}
              />
              <Bar dataKey="total" fill="rgb(var(--surface-2))" radius={[6, 6, 0, 0]} name="Total" />
              <Bar dataKey="done" fill="rgb(var(--accent))" radius={[6, 6, 0, 0]} name="Done" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function TaskStatusPanel({
  statusData,
  totalTasks,
}: {
  statusData: { key: TaskStatus; label: string; count: number; pct: number }[];
  totalTasks: number;
}) {
  return (
    <Panel title="Task status" subtitle="Where your work currently sits" icon={<Target size={14} />}>
      {totalTasks === 0 ? (
        <EmptyPanel
          icon={<Target size={22} />}
          title="No tasks yet"
          description="Add tasks to your projects to see this distribution come to life."
        />
      ) : (
        <div className="space-y-3">
          {statusData.map((entry) => {
            const cfg = STATUS_CONFIG[entry.key];
            return (
              <div key={entry.key}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className={clsx('flex items-center gap-2 font-semibold', cfg.text)}>
                    <span className={clsx('h-2 w-2 rounded-full', cfg.accent)} />
                    {entry.label}
                  </span>
                  <span className="text-muted">
                    <AnimatedCounter value={entry.count} /> ·{' '}
                    <AnimatedCounter value={entry.pct} suffix="%" />
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${entry.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={clsx('h-full rounded-full', cfg.accent)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function AssignedToMePanel({
  tasks,
  totalAssigned,
  search,
  setSearch,
  status,
  setStatus,
  priority,
  setPriority,
}: {
  tasks: Task[];
  totalAssigned: number;
  search: string;
  setSearch: (value: string) => void;
  status: TaskStatus | '';
  setStatus: (value: TaskStatus | '') => void;
  priority: TaskPriority | '';
  setPriority: (value: TaskPriority | '') => void;
}) {
  return (
    <Panel
      title="Assigned to me"
      subtitle="Open tasks that need your attention"
      icon={<CheckSquare size={14} />}
      action={
        <Link
          to="/tasks"
          className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/20"
        >
          View all <ArrowRight size={12} />
        </Link>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-2xl border border-border bg-bg-soft/60 p-2 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink placeholder-dim outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
        >
          <option value="">All statuses</option>
          {WORKFLOW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
        >
          <option value="">All priorities</option>
          {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_CONFIG[p].label}
            </option>
          ))}
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-soft/40 py-8 text-center text-xs text-muted">
          {totalAssigned === 0 ? "You're all caught up — nothing assigned right now." : 'No tasks match the filters'}
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date);
            const priorityCfg = PRIORITY_CONFIG[task.priority];
            const statusCfg = STATUS_CONFIG[normalizeWorkflowStatus(task.status)];
            return (
              <li
                key={task.id}
                className={clsx(
                  'group flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition',
                  overdue
                    ? 'border-danger/40 bg-danger/5'
                    : 'border-border bg-surface hover:border-accent/40 hover:bg-surface-2'
                )}
              >
                <span className={clsx('h-7 w-1 shrink-0 rounded-full', priorityCfg.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                  {task.due_date && (
                    <p className={clsx('mt-0.5 text-[11px]', overdue ? 'text-danger' : 'text-dim')}>
                      Due {formatDate(task.due_date)}
                    </p>
                  )}
                </div>
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                    statusCfg.text,
                    statusCfg.bg,
                    statusCfg.border
                  )}
                >
                  {statusCfg.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function TasksPerUserPanel({
  rows,
}: {
  rows: { id: string; name: string; count: number; color: string }[];
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <Panel title="Tasks per user" subtitle="Workload across visible projects" icon={<Users2 size={14} />}>
      {rows.length === 0 ? (
        <EmptyPanel
          icon={<Users2 size={22} />}
          title="No assignments yet"
          description="As you assign tasks to teammates, their workload will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-on-accent"
                    style={{ backgroundColor: row.color }}
                  >
                    {getInitials(row.name)}
                  </div>
                  <span className="truncate text-sm text-ink">{row.name}</span>
                </div>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">
                  <AnimatedCounter value={row.count} />
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max((row.count / max) * 100, 8)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function OverduePanel({ tasks }: { tasks: Task[] }) {
  return (
    <Panel
      title="Overdue"
      subtitle="Tasks that have slipped past their due date"
      icon={<AlertTriangle size={14} className="animate-pulse text-danger" />}
    >
      {tasks.length === 0 ? (
        <EmptyPanel
          icon={<CheckSquare size={22} />}
          title="Nothing overdue"
          description="Beautiful. Keep the streak going by reviewing upcoming due dates."
        />
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-3 py-2.5"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger/15 text-danger">
                <AlertTriangle size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                <p className="text-[11px] text-danger">Due {formatDate(task.due_date)}</p>
              </div>
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  PRIORITY_CONFIG[task.priority].bg,
                  PRIORITY_CONFIG[task.priority].text
                )}
              >
                {PRIORITY_CONFIG[task.priority].label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ActivityPanel({ items }: { items: ActivityItem[] }) {
  return (
    <Panel
      title="Recent activity"
      subtitle="The latest movement across your workspace"
      icon={<Clock size={14} />}
    >
      {items.length === 0 ? (
        <EmptyPanel
          icon={<Clock size={22} />}
          title="No activity yet"
          description="Once your team starts moving tasks and updating projects, you&rsquo;ll see the timeline here."
        />
      ) : (
        <ol className="relative space-y-4 pl-4">
          <span className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-border" />
          {items.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[14px] top-1.5 h-3 w-3 rounded-full bg-accent ring-4 ring-surface" />
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-3 py-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-on-accent"
                  style={{ backgroundColor: getAvatarColor(item.profile?.full_name || 'U') }}
                >
                  {getInitials(item.profile?.full_name || 'U')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">
                    <span className="font-semibold text-ink">{item.profile?.full_name || 'Someone'}</span>{' '}
                    {item.action}
                    {(item.meta as { title?: string })?.title && (
                      <> &ldquo;<span className="text-ink">{(item.meta as { title: string }).title}</span>&rdquo;</>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-dim">{formatRelative(item.created_at)}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function Panel({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        'rounded-3xl border border-border bg-surface p-5 shadow-soft',
        className
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30">
              {icon}
            </span>
          )}
          <div>
            <h3 className="font-display text-base font-semibold tracking-tight text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function EmptyPanel({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-soft/40 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        {icon}
      </span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted">{description}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7 p-5 lg:p-7">
      <div className="h-40 animate-pulse rounded-3xl border border-border bg-surface" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="h-72 animate-pulse rounded-3xl border border-border bg-surface xl:col-span-2" />
        <div className="h-72 animate-pulse rounded-3xl border border-border bg-surface" />
      </div>
    </div>
  );
}
