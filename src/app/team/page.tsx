'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Users, Shield, User as UserIcon } from 'lucide-react';

export default function TeamManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.role !== 'ADMIN') {
          router.push('/dashboard');
        } else {
          setCurrentUser(data.user);
          fetchUsers();
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError('');
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to update role');
        // Revert the UI select visually by fetching users again
        fetchUsers();
        return;
      }

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setError('An error occurred while updating the role');
      fetchUsers();
    }
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar />
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', maxWidth: '800px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users className="text-primary" size={32} />
            Team Management
          </h1>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', color: '#EF4444', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="card" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', backgroundColor: 'var(--surface-hover)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>User</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
                        <UserIcon size={16} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{user.name}</span>
                      {user.id === currentUser?.id && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', backgroundColor: '#E5E7EB', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>You</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {user.role === 'ADMIN' ? <Shield size={16} className="text-primary" /> : <UserIcon size={16} color="var(--text-muted)" />}
                      <select 
                        className="form-input" 
                        style={{ padding: '0.25rem 0.5rem', width: 'auto', fontSize: '0.875rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600 }}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.id === currentUser?.id && users.filter(u => u.role === 'ADMIN').length === 1} // Prevent removing last admin
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
