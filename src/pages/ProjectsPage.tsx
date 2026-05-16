import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckSquare,
  FolderKanban,
  Plus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useProjects } from '../contexts/ProjectContext';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import type { ProjectWithMeta } from '../lib/database.types';
import EmptyState from '../components/ui/EmptyState';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { clsx, formatRelative, ONBOARDING_STEPS } from '../lib/utils';

function ProjectCard({ project, index }: { project: ProjectWithMeta; index: number }) {
  const pct = project.task_count > 0
    ? Math.round((project.completed_count / project.task_count) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link to={`/projects/${project.id}`} className="block group">
        <article
          className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-soft transition-all duration-200 group-hover:-translate-y-1 group-hover:border-accent/40 group-hover:shadow-glow"
        >
          <span
            className="absolute inset-x-5 top-0 h-1 rounded-b-full"
            style={{ backgroundColor: project.color }}
          />
          <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-2xl"
            style={{ backgroundColor: project.color }}
          />

          <div className="relative mb-4 flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-accent shadow-glow ring-1 ring-border-strong/60"
              style={{ backgroundColor: project.color }}
            >
              <FolderKanban size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-semibold tracking-tight text-ink line-clamp-1">
                {project.name}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                {project.description || 'No description yet.'}
              </p>
            </div>
            <ArrowRight
              size={14}
              className="text-dim transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent"
            />
          </div>

          <div className="relative mb-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                <AnimatedCounter value={pct} suffix="% complete" />
              </span>
              <span className="text-muted">
                {project.completed_count} / {project.task_count} tasks
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

          <div className="relative flex items-center justify-between gap-3 border-t border-border pt-3 text-[11px] text-muted">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Users size={11} />
                {project.member_count} member{project.member_count !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckSquare size={11} />
                {project.task_count} task{project.task_count !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="truncate text-[10px] text-dim">
              Updated {formatRelative(project.updated_at)}
            </span>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const { projects, loadingProjects } = useProjects();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalTasks = projects.reduce((sum, p) => sum + p.task_count, 0);
  const totalDone = projects.reduce((sum, p) => sum + p.completed_count, 0);

  return (
    <div className="p-5 lg:p-7 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 lg:p-6"
      >
        <span className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              <Sparkles size={12} /> Projects
            </span>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {projects.length === 0
                ? 'Spin up your first project'
                : `${projects.length} project${projects.length === 1 ? '' : 's'} in motion`}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">
              Group work into clear initiatives. Each project gets its own kanban board, members, and activity log.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <Chip label={<><AnimatedCounter value={totalTasks} /> tasks</>} />
              <Chip label={<><AnimatedCounter value={totalDone} /> shipped</>} />
              <Chip
                label={
                  <>
                    <AnimatedCounter value={totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0} suffix="%" />{' '}
                    completion
                  </>
                }
              />
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="group inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong"
          >
            <Plus size={15} className="transition-transform group-hover:rotate-90" />
            New project
          </button>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5 transition focus-within:border-accent/40">
        <Search size={14} className="text-dim" />
        <input
          type="text"
          placeholder="Search your projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-ink placeholder-dim outline-none"
        />
      </div>

      {loadingProjects ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-3xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-6">
          <EmptyState
            icon={FolderKanban}
            title={search ? 'No projects match that search' : 'Your workspace is a fresh canvas'}
            description={
              search
                ? 'Try a different keyword or clear the search to see everything.'
                : 'Create your first project to start tracking work, inviting teammates, and shipping milestones.'
            }
            tips={search ? undefined : ONBOARDING_STEPS.map((s) => `${s.title} — ${s.description}`)}
            action={
              !search && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong"
                >
                  <Plus size={14} />
                  Create your first project
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function Chip({ label }: { label: React.ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted')}>
      {label}
    </span>
  );
}
