'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TaskModal from '@/components/TaskModal';
import { Plus, Clock, User as UserIcon, Trash2 } from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (data.user) setCurrentUser(data.user);
    });
    fetchProject();
    fetchTasks();
    fetchUsers();
  }, [id]);

  const fetchProject = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    if (data.projects) {
      const found = data.projects.find((p: any) => p.id === id);
      setProject(found || null);
    }
  };

  const fetchTasks = async () => {
    const res = await fetch(`/api/tasks?projectId=${id}`);
    const data = await res.json();
    if (data.tasks) setTasks(data.tasks);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.users) setUsers(data.users);
  };

  const handleSaveTask = async (taskData: any) => {
    if (editingTask) {
      await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
    } else {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
    }
    setShowModal(false);
    setEditingTask(null);
    fetchTasks();
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setShowModal(false);
      setEditingTask(null);
      fetchTasks();
    }
  };

  const handleDeleteProject = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete this project? All tasks in it will be permanently removed.'
      )
    ) {
      return;
    }
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/dashboard');
    }
  };

  const COLUMNS = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const COLUMN_LABELS: Record<string, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    REVIEW: 'Review',
    DONE: 'Done'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar />
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>{project?.name || 'Project Tasks'}</h1>
            {project?.description && (
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{project.description}</p>
            )}
          </div>
          {currentUser?.role === 'ADMIN' && (
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteProject}
              >
                <Trash2 size={16} /> Delete Project
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { setEditingTask(null); setShowModal(true); }}
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
          )}
        </div>

        <div className="kanban-board">
          {COLUMNS.map(col => (
            <div key={col} className="kanban-column">
              <div className="kanban-column-header">
                {COLUMN_LABELS[col]}
                <span className={`badge badge-${col}`}>{tasks.filter(t => t.status === col).length}</span>
              </div>
              
              {tasks.filter(t => t.status === col).map(task => (
                <div key={task.id} className="task-card" onClick={() => {
                   if (currentUser?.role === 'ADMIN') {
                     setEditingTask(task);
                     setShowModal(true);
                   }
                }}>
                  <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>{task.title}</h3>
                  </div>
                  <p style={{ fontSize: '0.875rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {task.description}
                  </p>
                  
                  <div className="flex justify-between items-center" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-1">
                      <UserIcon size={12} />
                      {task.assignee ? task.assignee.name : 'Unassigned'}
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {/* Status quick actions for members */}
                  {currentUser?.role === 'MEMBER' && (
                    <div className="flex gap-2" style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                      <select 
                        className="form-input" 
                        style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                        value={task.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateTaskStatus(task.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {COLUMNS.map(c => <option key={c} value={c}>{COLUMN_LABELS[c]}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>

      <TaskModal 
        show={showModal} 
        onClose={() => { setShowModal(false); setEditingTask(null); }} 
        task={editingTask}
        projectId={id}
        users={users}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
