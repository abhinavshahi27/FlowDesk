import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useProjects } from '../../contexts/ProjectContext';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Workspace', subtitle: 'Your delivery pulse at a glance' },
  '/projects': { title: 'Projects', subtitle: 'Plan, scope, and lead every initiative' },
  '/tasks': { title: 'My Tasks', subtitle: 'Work that needs your attention today' },
  '/settings': { title: 'Settings', subtitle: 'Profile, theme, and workspace preferences' },
};

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { fetchProjects } = useProjects();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const meta = PAGE_META[location.pathname] ?? PAGE_META['/dashboard'];
  const onProjectDetail = location.pathname.startsWith('/projects/');

  return (
    <div className="flex h-screen overflow-hidden bg-bg bg-panel-gradient">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setMobileMenuOpen(true)}
          title={onProjectDetail ? 'Project' : meta.title}
          subtitle={onProjectDetail ? 'Board, members, and project settings' : meta.subtitle}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
