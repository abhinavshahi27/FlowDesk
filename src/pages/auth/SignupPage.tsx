import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowRight, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import Brand from '../../components/ui/Brand';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';
import { ONBOARDING_STEPS } from '../../lib/utils';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80, 'Name is too long'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { error, needsEmailConfirmation } = await signUp(data.email, data.password, data.fullName);
    setIsSubmitting(false);

    if (error) {
      toast.error(
        error.message.includes('already registered')
          ? 'An account with this email already exists'
          : error.message
      );
      return;
    }

    if (needsEmailConfirmation) {
      toast.success('Account created — check your email to confirm and sign in.');
      navigate('/login', { replace: true });
      return;
    }

    toast.success('Welcome to FlowDesk');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-bg lg:flex-row">
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-surface bg-panel-gradient p-10 lg:flex xl:p-14">
        <span className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <span className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-accent-2/25 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <Brand size="md" />
          <span className="rounded-full border border-border bg-surface-2/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted">
            7-min setup
          </span>
        </div>

        <div className="relative space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            <Sparkles size={12} className="animate-pulse" />
            Start a fresh workspace
          </span>
          <h2 className="font-display text-4xl font-semibold leading-tight text-ink text-balance">
            One workspace for <span className="gradient-text">briefs, sprints, and delivery.</span>
          </h2>
          <p className="max-w-md text-sm leading-7 text-muted">
            Bring projects, members, and your kanban board together. Switch themes, animate your numbers, and ship work with a UI that feels at home in your week.
          </p>

          <div className="grid gap-3">
            {ONBOARDING_STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex gap-3 rounded-2xl border border-border bg-surface-2/70 px-4 py-3"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent ring-1 ring-accent/30">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="text-xs text-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-dim">
          <CheckCircle2 size={14} className="text-success" />
          Secured by Supabase Auth and row-level security
        </div>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute right-5 top-5">
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">FlowDesk</p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-muted">Spin up a workspace and invite your team in minutes.</p>

            {!isSupabaseConfigured && (
              <div className="mt-5 rounded-2xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-xs text-warning">
                Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to <code>.env</code> to enable sign up.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <Field label="Full name" error={errors.fullName?.message}>
                <input
                  {...register('fullName')}
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Johnson"
                  className="form-input"
                />
              </Field>

              <Field label="Work email" error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="form-input"
                />
              </Field>

              <Field label="Password" error={errors.password?.message}>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
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
                    Create account
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent hover:opacity-80">
                Sign in
              </Link>
            </p>
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
      `}</style>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
