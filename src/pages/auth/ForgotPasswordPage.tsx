import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Brand from '../../components/ui/Brand';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!isSupabaseConfigured) {
      toast.error('Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error('Failed to send reset email');
      return;
    }
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg bg-panel-gradient px-5 py-10">
      <div className="absolute right-5 top-5">
        <ThemeSwitcher />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex items-center gap-2">
          <Brand size="sm" />
        </div>

        <div className="rounded-3xl border border-border bg-surface p-7 shadow-soft">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 ring-1 ring-success/40">
                <CheckCircle className="text-success" size={26} />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted">
                We sent a reset link to your email. It may take a minute to arrive.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-accent hover:opacity-80"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
                  <Mail size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">FlowDesk</p>
                  <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">Reset password</h1>
                  <p className="mt-1 text-sm text-muted">We&rsquo;ll email you a secure link.</p>
                </div>
              </div>

              {!isSupabaseConfigured && (
                <div className="mb-5 rounded-2xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-xs text-warning">
                  Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to <code>.env</code> to enable password reset.
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@company.com"
                    className="form-input"
                  />
                  {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/70 border-t-transparent" />
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-1.5 text-sm text-muted transition hover:text-ink"
                >
                  <ArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>

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
