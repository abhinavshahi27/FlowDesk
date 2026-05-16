'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white mb-2" style={{ backgroundColor: 'var(--primary)' }}>
            <LogIn size={24} />
          </div>
          <h2>Welcome Back</h2>
          <p>Login to your FlowDesk account</p>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-white bg-red-500 rounded-md" style={{ backgroundColor: 'var(--status-review)', color: '#fff', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Login
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Don't have an account? <Link href="/register" className="font-semibold text-primary">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
