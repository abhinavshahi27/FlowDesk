import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../contexts/ProjectContext';
import CreateProjectModal from '../projects/CreateProjectModal';
import Brand from '../ui/Brand';
import { clsx, getInitials, getAvatarColor } from '../../lib/utils';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  to: string;
  hint?: string;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard', hint: 'Overview' },
    { icon: FolderKanban, label: 'Projects', to: '/projects', hint: 'Boards & briefs' },
    { icon: CheckSquare, label: 'My Tasks', to: '/tasks', hint: 'Assigned to you' },
    { icon: Settings, label: 'Settings', to: '/settings', hint: 'Profile & themes' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={clsx(
          'flex h-16 items-center border-b border-border px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <motion.div
              key="logo-only"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
            >
              <Brand size="sm" withWordmark={false} />
            </motion.div>
          ) : (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
            >
              <Brand size="sm" />
            </motion.div>
          )}
        </AnimatePresence>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink lg:flex"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-3 hidden rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink lg:flex"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      )}

      <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-2.5 py-4">
        <p
          className={clsx(
            'mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-dim',
            collapsed && 'sr-only'
          )}
        >
          Workspace
        </p>
        {navItems.map(({ icon: Icon, label, to, hint }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-accent/12 text-ink ring-1 ring-accent/35 shadow-glow'
                  : 'text-muted hover:bg-surface-2 hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <motion.span
                    layoutId="sidebar-active-rail"
                    className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-brand-gradient"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  />
                )}
                <span
                  className={clsx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300',
                    isActive
                      ? 'bg-brand-gradient text-on-accent shadow-glow'
                      : 'bg-surface-2 text-muted group-hover:scale-110 group-hover:text-accent'
                  )}
                >
                  <Icon
                    size={15}
                    className={clsx(
                      'transition-transform duration-300',
                      'group-hover:rotate-6 group-active:scale-90'
                    )}
                  />
                </span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.12 }}
                      className="flex min-w-0 flex-1 flex-col leading-tight"
                    >
                      <span className="truncate text-sm">{label}</span>
                      {hint && (
                        <span className="truncate text-[11px] font-normal text-dim group-hover:text-muted">
                          {hint}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}

        {!collapsed && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">Projects</span>
              <button
                onClick={() => setShowCreateProject(true)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-dim transition hover:bg-surface-2 hover:text-accent"
                aria-label="Create project"
              >
                <Plus size={13} />
              </button>
            </div>
            {projects.length === 0 ? (
              <button
                onClick={() => setShowCreateProject(true)}
                className="group flex w-full items-center gap-2 rounded-xl border border-dashed border-border bg-surface-2/40 px-3 py-3 text-left text-xs text-muted transition hover:border-accent/40 hover:text-ink"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent transition group-hover:scale-110">
                  <Sparkles size={13} />
                </span>
                Start your first project
              </button>
            ) : (
              <div className="space-y-1 rounded-2xl bg-surface-2/60 p-1.5 ring-1 ring-border">
                {projects.slice(0, 8).map((project) => (
                  <NavLink
                    key={project.id}
                    to={`/projects/${project.id}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs transition',
                        isActive
                          ? 'bg-surface text-ink ring-1 ring-accent/30'
                          : 'text-muted hover:bg-surface hover:text-ink'
                      )
                    }
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full transition-transform group-hover:scale-125"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-2xl bg-surface-2/70 p-2 ring-1 ring-border">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-on-accent"
              style={{ backgroundColor: getAvatarColor(profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'U') }}
            >
              {getInitials(profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'User')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'User'}</p>
              <p className="truncate text-[11px] text-dim">{profile?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-lg p-1.5 text-dim transition hover:bg-surface hover:text-danger"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center rounded-lg p-2 text-dim transition hover:bg-surface-2 hover:text-danger"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 64 : 248 }}
        transition={{ duration: 0.22 }}
        className="hidden shrink-0 flex-col overflow-hidden border-r border-border bg-surface/95 backdrop-blur lg:flex"
      >
        {sidebarContent}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-border bg-surface lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}
    </>
  );
}
