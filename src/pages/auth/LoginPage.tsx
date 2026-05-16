import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  Sparkles,
  Layers,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import Brand from '../../components/ui/Brand';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';
import { clsx, PRODUCTIVITY_TIPS, SAMPLE_WORKSPACES } from '../../lib/utils';

type LoginMode = 'admin' | 'member';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

const MODE_COPY: Record<LoginMode, { title: string; subtitle: string; cta: string }> = {
  admin: {
    title: 'Admin sign in',
    subtitle: 'Manage projects, members, and the team backlog.',
    cta: 'Continue to admin workspace',
  },
  member: {
    title: 'Member sign in',
    subtitle: 'Pick up your assigned tasks and move them forward.',
    cta: 'Continue to your tasks',
  },
};

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode: LoginMode = searchParams.get('role') === 'member' ? 'member' : 'admin';
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const current = searchParams.get('role');
    if (mode !== current) {
      const next = new URLSearchParams(searchParams);
      next.set('role', mode);
      setSearchParams(next, { replace: true });
    }
  }, [mode, searchParams, setSearchParams]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);

    if (error) {
      toast.error(
        error.message.includes('Missing VITE_') || error.message.includes('Email not confirmed')
          ? error.message
          : 'Those credentials did not match a FlowDesk account'
      );
      return;
    }

    toast.success(mode === 'admin' ? 'Welcome back, admin' : 'Welcome back to FlowDesk');
    navigate('/dashboard', { replace: true });
  };

  const copy = MODE_COPY[mode];

  return (
    <div className="relative flex min-h-screen flex-col bg-bg lg:flex-row">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-surface bg-panel-gradient p-10 lg:flex xl:p-14">
        <span className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <span className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-accent-2/25 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <Brand size="md" />
          <span className="rounded-full border border-border bg-surface-2/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted">
            Workspace v2
          </span>
        </div>

        <div className="relative space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            <Sparkles size={12} className="animate-pulse" />
            Premium team workspace
          </span>
          <h2 className="font-display text-4xl font-semibold leading-tight text-ink text-balance">
            Plan sprints, ship work, and keep <span className="gradient-text">every teammate aligned.</span>
          </h2>
          <p className="max-w-md text-sm leading-7 text-muted">
            FlowDesk pairs a polished kanban board, animated dashboards, and four custom themes so your delivery
            workflow finally feels as good as the work you ship.
          </p>

          <div className="grid gap-3">
            {SAMPLE_WORKSPACES.map((w) => (
              <div
                key={w.label}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2/70 px-3 py-3 ring-1 ring-white/[0.02]"
              >
                <span className="h-9 w-9 shrink-0 rounded-xl" style={{ backgroundColor: w.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{w.label}</p>
                  <p className="text-xs text-muted truncate">{w.description}</p>
                </div>
                <Layers size={14} className="text-dim" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">Productivity tip</p>
          <p className="max-w-md text-sm text-muted">{PRODUCTIVITY_TIPS[0]}</p>
        </div>
      </aside>

      {/* Auth panel */}
      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <ThemeSwitcher />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Brand size="sm" />
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-8">
            <div className="mb-6 flex items-center gap-2 rounded-2xl bg-bg-soft p-1 ring-1 ring-border">
              {(['admin', 'member'] as const).map((option) => {
                const active = option === mode;
                const Icon = option === 'admin' ? ShieldCheck : Users;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option)}
                    className={clsx(
                      'relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition',
                      active
                        ? 'text-on-accent'
                        : 'text-muted hover:text-ink'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="login-mode-pill"
                        className="absolute inset-0 rounded-xl bg-brand-gradient shadow-glow"
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      />
                    )}
                    <Icon size={14} className="relative" />
                    <span className="relative uppercase tracking-wider">
                      {option === 'admin' ? 'Admin login' : 'Member login'}
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="mb-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">FlowDesk</p>
                <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{copy.title}</h1>
                <p className="mt-2 text-sm text-muted">{copy.subtitle}</p>
              </motion.div>
            </AnimatePresence>

            {!isSupabaseConfigured && (
              <div className="mb-5 rounded-2xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-xs text-warning">
                Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to <code>.env</code> to enable authentication.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="form-input"
                />
              </Field>

              <Field
                label="Password"
                error={errors.password?.message}
                trailing={
                  <Link to="/forgot-password" className="text-xs font-medium text-accent hover:opacity-80">
                    Forgot password?
                  </Link>
                }
              >
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={mode === 'admin' ? 'Your admin password' : 'Your password'}
                    className="form-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dim transition hover:text-ink"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/70 border-t-transparent" />
                ) : (
                  <>
                    {copy.cta}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs text-dim">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <p className="mt-5 text-center text-sm text-muted">
              New to FlowDesk?{' '}
              <Link to="/signup" className="font-semibold text-accent hover:opacity-80">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-dim">
            <Compass size={12} />
            <span>Both modes use the same secure Supabase sign-in.</span>
          </div>
        </motion.div>
      </main>

      <style>{`
        .form-input {
          width: 100%;
          background: rgb(var(--bg-soft));
          border: 1px solid rgb(var(--border));
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          color: rgb(var(--text));
          transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
        }
        .form-input::placeholder { color: rgb(var(--text-dim)); }
        .form-input:focus {
          outline: none;
          border-color: rgb(var(--accent));
          box-shadow: 0 0 0 3px rgb(var(--accent) / 0.18);
          background: rgb(var(--surface));
        }
        .form-input:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

function Field({ label, error, trailing, children }: FieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</label>
        {trailing}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
