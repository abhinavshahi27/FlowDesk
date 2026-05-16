'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, user, onUserUpdate }: any) {
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form only when the modal opens
  useEffect(() => {
    if (isOpen) {
      setEditName(user?.name || '');
      setEditEmail(user?.email || '');
      setMessage('');
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setMessage('');
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        onUserUpdate(data.user);
        onClose();
      } else {
        setMessage(data.error || 'Failed to save settings');
      }
    } catch {
      setMessage('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} className="text-primary" /> Settings
        </h2>

        {message && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: message.includes('success') ? '#D1FAE5' : '#FEE2E2',
              color: message.includes('success') ? '#047857' : '#EF4444',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            {message}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
