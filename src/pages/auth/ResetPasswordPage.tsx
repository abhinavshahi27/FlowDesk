import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Brand from '../../components/ui/Brand';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Password updated. Please sign in again.');
    navigate('/login', { replace: true });
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
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent ring-1 ring-accent/30">
              <KeyRound size={18} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">FlowDesk</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
                Set a new password
              </h1>
              <p className="mt-1 text-sm text-muted">Choose a strong password for your workspace.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                New password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className="form-input"
              />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Confirm password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                autoComplete="new-password"
                className="form-input"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/70 border-t-transparent" />
              ) : (
                'Update password'
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
