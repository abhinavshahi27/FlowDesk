'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, User, Settings, Info, ChevronDown, Users } from 'lucide-react';

import SettingsModal from './SettingsModal';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: string, name: string, role: string, email?: string, createdAt?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="navbar">
      <Link 
        href="/dashboard" 
        className="navbar-brand"
        onClick={(e) => {
          e.preventDefault();
          window.location.href = '/dashboard';
        }}
      >
        <LayoutDashboard className="text-primary" />
        FlowDesk
      </Link>
      <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user ? (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.25rem' }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: '36px', height: '36px', borderRadius: '50%', 
                backgroundColor: '#F3F4F6', color: 'var(--text-main)' 
              }}>
                <User size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: '1.2' }}>{user.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px', fontWeight: 600 }}>{user.role}</span>
              </div>
              <ChevronDown size={16} color="var(--text-muted)" style={{ marginLeft: '0.25rem' }} />
            </div>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                minWidth: '220px', zIndex: 50, padding: '0.5rem 0',
                animation: 'fadeIn 0.2s ease-out'
              }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{user.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{user.email || 'Welcome back!'}</p>
                </div>
                
                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); setShowProfileModal(true); }}>
                  <Info size={16} /> Profile Info
                </button>
                {user.role === 'ADMIN' && (
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); router.push('/team'); }}>
                    <Users size={16} /> Manage Team
                  </button>
                )}
                <button className="dropdown-item" onClick={() => { 
                  setDropdownOpen(false); 
                  setShowSettingsModal(true); 
                }}>
                  <Settings size={16} /> Settings
                </button>
                <button className="dropdown-item" onClick={handleLogout} style={{ color: '#EF4444' }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
           <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
             <LogOut size={16} /> Logout
           </button>
        )}
      </div>
      {showProfileModal && user && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false) }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={24} className="text-primary" /> Profile Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Name</label>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user.name}</div>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user.email}</div>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Account Role</label>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginTop: '0.25rem' }}>
                  <span className={`badge badge-${user.role === 'ADMIN' ? 'REVIEW' : 'IN_PROGRESS'}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-muted)' }}>Joined On</label>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowProfileModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        user={user} 
        onUserUpdate={(updatedUser: { id?: string; name: string; role: string; email?: string; createdAt?: string }) => {
          setUser(updatedUser);
          router.refresh();
        }} 
      />
    </nav>
  );
}
