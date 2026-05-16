'use client';

import { useState, useEffect } from 'react';

export default function TaskModal({ 
  show, 
  onClose, 
  task, 
  projectId, 
  users, 
  onSave,
  onDelete
}: any) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'TODO');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setAssigneeId('');
      setDueDate('');
    }
  }, [task, show]);

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, status, assigneeId: assigneeId || null, dueDate: dueDate || null, projectId });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content">
        <h2 style={{ marginBottom: '1.5rem' }}>{task ? 'Edit Task' : 'Create Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input type="text" className="form-input" required value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={description} onChange={e => setDescription(e.target.value)}></textarea>
          </div>
          <div className="flex gap-4" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">Assignee</label>
              <select className="form-input" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="flex justify-between" style={{ marginTop: '2rem' }}>
            {task && onDelete ? (
              <button 
                type="button" 
                className="btn" 
                style={{ backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #FCA5A5' }} 
                onClick={() => onDelete(task.id)}
              >
                Delete
              </button>
            ) : <div></div>}
            <div className="flex gap-2">
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">{task ? 'Save Changes' : 'Create Task'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
