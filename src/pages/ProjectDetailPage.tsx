import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Crown,
  Layers,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjects } from '../contexts/ProjectContext';
import { useTasks } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskModal from '../components/tasks/TaskModal';
import type { TaskPriority, TaskStatus } from '../lib/database.types';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  WORKFLOW_STATUSES,
  clsx,
  getAvatarColor,
  getInitials,
  normalizeWorkflowStatus,
} from '../lib/utils';
import AnimatedCounter from '../components/ui/AnimatedCounter';

type Tab = 'board' | 'members' | 'settings';

const TAB_META: Record<Tab, { icon: typeof Layers; label: string }> = {
  board: { icon: Layers, label: 'Board' },
  members: { icon: Users, label: 'Members' },
  settings: { icon: Settings, label: 'Settings' },
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentProject,
    members,
    fetchProject,
    updateProject,
    deleteProject,
    inviteMember,
    removeMember,
  } = useProjects();
  const { tasks, fetchTasks, loadingTasks } = useTasks();
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');

  const isAdmin = members.find((m) => m.user_id === user?.id)?.role === 'admin';

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchTasks(id);
    }
  }, [id, fetchProject, fetchTasks]);

  useEffect(() => {
    if (currentProject) {
      setNameValue(currentProject.name);
      setDescriptionValue(currentProject.description ?? '');
    }
  }, [currentProject]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !id) return;
    setInviting(true);
    await inviteMember(id, inviteEmail.trim());
    setInviting(false);
    setInviteEmail('');
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    if (window.confirm(`Delete "${currentProject?.name}"? This will remove all tasks.`)) {
      await deleteProject(id);
      toast.success('Project deleted');
      navigate('/projects');
    }
  };

  const handleSaveName = async () => {
    if (!id || !nameValue.trim()) return;
    await updateProject(id, { name: nameValue });
    setEditingName(false);
    toast.success('Project name updated');
  };

  const handleSaveDescription = async () => {
    if (!id) return;
    await updateProject(id, { description: descriptionValue });
    toast.success('Project details saved');
  };

  if (!currentProject) {
    return (
      <div className="p-6 lg:p-7">
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-3xl border border-border bg-surface" />
          <div className="h-64 animate-pulse rounded-3xl border border-border bg-surface" />
        </div>
      </div>
    );
  }

  const pct = currentProject.task_count > 0
    ? Math.round((currentProject.completed_count / currentProject.task_count) * 100)
    : 0;

  const filteredTasks = tasks.filter((task) => {
    const query = taskSearch.trim().toLowerCase();
    const matchesSearch = !query
      || task.title.toLowerCase().includes(query)
      || task.description.toLowerCase().includes(query)
      || task.tags.some((tag) => tag.toLowerCase().includes(query));
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesStatus = !filterStatus || normalizeWorkflowStatus(task.status) === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const visibleTabs: Tab[] = isAdmin ? ['board', 'members', 'settings'] : ['board', 'members'];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-surface/85 px-5 pt-5 backdrop-blur lg:px-7">
        <button
          onClick={() => navigate('/projects')}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={13} />
          All projects
        </button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-on-accent shadow-glow ring-1 ring-border-strong/60"
              style={{ backgroundColor: currentProject.color }}
            >
              <Layers size={22} />
            </div>
            <div className="min-w-0 flex-1">
              {editingName && isAdmin ? (
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="w-full bg-transparent font-display text-2xl font-semibold tracking-tight text-ink outline-none ring-0 focus:border-b-2 focus:border-accent/60"
                  autoFocus
                />
              ) : (
                <h1
                  className={clsx(
                    'font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl',
                    isAdmin && 'cursor-pointer transition hover:text-accent'
                  )}
                  onClick={() => isAdmin && setEditingName(true)}
                  title={isAdmin ? 'Click to rename' : undefined}
                >
                  {currentProject.name}
                </h1>
              )}
              <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-muted">
                {currentProject.description || 'Add a short description to give context to teammates.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Pill icon={<Layers size={11} />} label={`${currentProject.task_count} tasks`} />
                <Pill icon={<Users size={11} />} label={`${currentProject.member_count} members`} />
                <Pill
                  icon={<ShieldCheck size={11} />}
                  label={isAdmin ? 'You are admin' : 'You are member'}
                  tone={isAdmin ? 'accent' : 'muted'}
                />
                <Pill
                  label={
                    <>
                      <AnimatedCounter value={pct} suffix="%" /> complete
                    </>
                  }
                  tone="success"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center -space-x-2 sm:flex">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-on-accent ring-2 ring-surface"
                  style={{ backgroundColor: getAvatarColor(m.profile.full_name) }}
                  title={m.profile.full_name}
                >
                  {getInitials(m.profile.full_name)}
                </div>
              ))}
              {members.length > 5 && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted ring-2 ring-surface">
                  +{members.length - 5}
                </span>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => setNewTaskOpen(true)}
                className="group inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong"
              >
                <Plus size={13} className="transition-transform group-hover:rotate-90" />
                Add task
              </button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
            <span>{currentProject.completed_count} of {currentProject.task_count} tasks shipped</span>
            <span><AnimatedCounter value={pct} suffix="%" /></span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: currentProject.color }}
            />
          </div>
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto -mb-px">
          {visibleTabs.map((tab) => {
            const meta = TAB_META[tab];
            const Icon = meta.icon;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'group flex items-center gap-2 rounded-t-xl border-b-2 px-3 py-2.5 text-xs font-semibold transition',
                  active
                    ? 'border-accent text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                )}
              >
                <span
                  className={clsx(
                    'flex h-6 w-6 items-center justify-center rounded-md transition',
                    active ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-dim group-hover:text-ink'
                  )}
                >
                  <Icon size={12} />
                </span>
                {meta.label}
                {tab === 'members' && (
                  <span className="rounded-full bg-surface-2 px-1.5 text-[10px] font-semibold text-muted">
                    {members.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'board' && (
            <motion.div
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-auto p-5 lg:p-7"
            >
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 transition focus-within:border-accent/40">
                  <Search size={13} className="text-dim" />
                  <input
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search tasks"
                    className="w-44 bg-transparent text-xs text-ink placeholder-dim outline-none"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink outline-none transition focus:border-accent/40"
                >
                  <option value="">All statuses</option>
                  {(WORKFLOW_STATUSES as TaskStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_CONFIG[status].label}
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
                <span className="ml-auto rounded-full border border-border bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted">
                  {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loadingTasks ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-surface" />
                  ))}
                </div>
              ) : (
                <KanbanBoard
                  projectId={currentProject.id}
                  members={members}
                  tasks={filteredTasks}
                  currentUserId={user?.id}
                  isAdmin={Boolean(isAdmin)}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-y-auto p-5 lg:p-7"
            >
              <div className="grid max-w-4xl grid-cols-1 gap-5 lg:grid-cols-5">
                {isAdmin && (
                  <div className="rounded-3xl border border-border bg-surface p-5 lg:col-span-2">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30">
                        <UserPlus size={15} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-ink">Invite a teammate</h3>
                        <p className="text-[11px] text-muted">Add them by their FlowDesk email.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        className="w-full rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 text-sm text-ink placeholder-dim outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                      />
                      <button
                        onClick={handleInvite}
                        disabled={inviting || !inviteEmail.trim()}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong disabled:opacity-60"
                      >
                        {inviting ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/70 border-t-transparent" />
                        ) : (
                          <>
                            <UserPlus size={13} />
                            Send invite
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className={clsx('overflow-hidden rounded-3xl border border-border bg-surface', isAdmin ? 'lg:col-span-3' : 'lg:col-span-5')}>
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold text-ink">Team members</h3>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                      {members.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {members.map((member) => (
                      <li key={member.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-on-accent"
                          style={{ backgroundColor: getAvatarColor(member.profile.full_name) }}
                        >
                          {getInitials(member.profile.full_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{member.profile.full_name}</p>
                          <p className="truncate text-[11px] text-muted">{member.profile.email}</p>
                        </div>
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1',
                            member.role === 'admin'
                              ? 'bg-accent/10 text-accent ring-accent/30'
                              : 'bg-surface-2 text-muted ring-border'
                          )}
                        >
                          {member.role === 'admin' ? <Crown size={10} /> : <Users size={10} />}
                          {member.role}
                        </span>
                        {isAdmin && member.user_id !== user?.id && (
                          <button
                            onClick={() => id && removeMember(id, member.user_id)}
                            className="rounded-md p-1.5 text-dim transition hover:bg-danger/10 hover:text-danger"
                            title="Remove member"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && isAdmin && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-y-auto p-5 lg:p-7"
            >
              <div className="max-w-2xl space-y-5">
                <section className="rounded-3xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold text-ink">Project details</h3>
                  <p className="mt-1 text-[11px] text-muted">Name and description are visible to every member.</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                        Name
                      </label>
                      <input
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="w-full rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                        Description
                      </label>
                      <textarea
                        value={descriptionValue}
                        onChange={(e) => setDescriptionValue(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveName}
                        className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong"
                      >
                        Save name
                      </button>
                      <button
                        onClick={handleSaveDescription}
                        className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-accent/40"
                      >
                        Save description
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-danger/30 bg-danger/5 p-5">
                  <h3 className="text-sm font-semibold text-danger">Danger zone</h3>
                  <p className="mt-1 text-[11px] text-danger/80">
                    Deleting a project removes its tasks and member history. This cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteProject}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <Trash2 size={14} />
                    Delete project
                  </button>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {newTaskOpen && (
        <TaskModal
          task={null}
          projectId={currentProject.id}
          members={members}
          defaultStatus={'todo' as TaskStatus}
          isAdmin={Boolean(isAdmin)}
          currentUserId={user?.id}
          onClose={() => setNewTaskOpen(false)}
        />
      )}
    </div>
  );
}

function Pill({
  icon,
  label,
  tone = 'muted',
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  tone?: 'muted' | 'accent' | 'success';
}) {
  const toneMap: Record<string, string> = {
    muted: 'bg-surface-2 text-muted ring-border',
    accent: 'bg-accent/10 text-accent ring-accent/30',
    success: 'bg-success/10 text-success ring-success/30',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ring-1',
        toneMap[tone]
      )}
    >
      {icon}
      {label}
    </span>
  );
}
