'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Plus, Folder } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [user, setUser] = useState<{ id: string, name: string, role: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      });

    fetchProjects();
    fetchRecentTasks();
  }, []);

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    if (data.projects) setProjects(data.projects);
  };

  const fetchRecentTasks = async () => {
    const res = await fetch('/api/tasks?recent=true');
    const data = await res.json();
    if (data.tasks) setRecentTasks(data.tasks);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName, description: newProjectDesc })
    });
    if (res.ok) {
      setShowModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      fetchProjects();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar />
      
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.name}</p>
          </div>
          {user?.role === 'ADMIN' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> New Project
            </button>
          )}
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Recent Tasks (Last 3 Days)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {recentTasks.map((task: any) => (
              <div key={task.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', margin: 0 }}>{task.title}</h3>
                  <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                </div>
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>{task.description}</p>
                <div className="flex justify-between items-center" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <span>Project: {task.project?.name}</span>
                  <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <div style={{ color: 'var(--text-muted)' }}>No recent tasks found.</div>
            )}
          </div>
        </div>

        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Your Projects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {projects.map((project: any) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <div className="card" style={{ height: '100%' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                  <Folder className="text-primary" size={24} />
                  <h3>{project.name}</h3>
                </div>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <span className="badge badge-TODO" style={{ fontSize: '0.75rem' }}>
                    {project._count.tasks} Tasks
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    By {project.owner.name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
             <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
               No projects found.
             </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-between" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
