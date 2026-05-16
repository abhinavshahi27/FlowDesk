import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Paintbrush, Save, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAvatarColor, getInitials } from '../lib/utils';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import { useTheme } from '../contexts/ThemeContext';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const { themes, theme } = useTheme();
  const [savingProfile, setSavingProfile] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  });

  useEffect(() => {
    if (profile?.full_name) {
      profileForm.reset({ full_name: profile.full_name });
    }
  }, [profile?.full_name, profileForm]);

  const onSaveProfile = async (data: ProfileFormData) => {
    setSavingProfile(true);
    await updateProfile({ full_name: data.full_name });
    setSavingProfile(false);
    toast.success('Profile updated');
  };

  const activeTheme = themes.find((t) => t.id === theme);

  return (
    <div className="space-y-6 p-5 lg:p-7">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6"
      >
        <span className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-accent-2/20 blur-3xl" />
        <div className="relative flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles size={12} /> Settings
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Tune FlowDesk to your taste
          </h1>
          <p className="max-w-2xl text-sm text-muted">
            Update your profile, switch your workspace theme, and review your security status. Theme preferences live in your browser only — nothing here changes shared data.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30">
              <User size={15} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Profile</h2>
              <p className="text-[11px] text-muted">Visible to teammates on every project.</p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-4 rounded-2xl border border-border bg-bg-soft p-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-on-accent shadow-glow"
              style={{ backgroundColor: getAvatarColor(profile?.full_name || 'U') }}
            >
              {getInitials(profile?.full_name || 'User')}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{profile?.full_name}</p>
              <p className="text-xs text-muted">{profile?.email}</p>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
                Full name
              </label>
              <input
                {...profileForm.register('full_name')}
                type="text"
                className="form-control"
              />
              {profileForm.formState.errors.full_name && (
                <p className="mt-1 text-xs text-danger">
                  {profileForm.formState.errors.full_name.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
                Email
              </label>
              <input
                value={profile?.email ?? ''}
                disabled
                type="email"
                className="form-control disabled-control"
              />
              <p className="mt-1 text-[11px] text-dim">Email is managed by your auth provider and cannot be changed here.</p>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong disabled:opacity-60"
            >
              {savingProfile ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/70 border-t-transparent" />
              ) : (
                <>
                  <Save size={14} /> Save changes
                </>
              )}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-2/10 text-accent-2 ring-1 ring-accent-2/30 transition hover:rotate-12">
              <Paintbrush size={15} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Workspace theme</h2>
              <p className="text-[11px] text-muted">
                {activeTheme ? `Current: ${activeTheme.name}` : 'Pick a vibe for your dashboard.'}
              </p>
            </div>
          </div>

          <ThemeSwitcher variant="inline" />

          <p className="mt-4 rounded-2xl border border-border bg-bg-soft px-3 py-2 text-[11px] text-muted">
            Theme preference is saved locally on this device. It never touches Supabase or your account data.
          </p>
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/30">
            <ShieldCheck size={15} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Account & security</h2>
            <p className="text-[11px] text-muted">Authenticated via Supabase Auth with row-level security.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SecurityChip label="Session" value="Active" tone="success" />
          <SecurityChip label="2FA" value="Managed by Supabase" tone="muted" />
          <SecurityChip label="RLS" value="Enforced server-side" tone="accent" />
        </div>
      </section>

      <style>{`
        .form-control {
          width: 100%;
          background: rgb(var(--bg-soft));
          border: 1px solid rgb(var(--border));
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          color: rgb(var(--text));
          transition: border-color 120ms ease, box-shadow 120ms ease;
        }
        .form-control:focus {
          outline: none;
          border-color: rgb(var(--accent));
          box-shadow: 0 0 0 3px rgb(var(--accent) / 0.18);
        }
        .disabled-control { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function SecurityChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'muted' | 'accent';
}) {
  const toneMap: Record<string, string> = {
    success: 'border-success/30 bg-success/10 text-success',
    muted: 'border-border bg-surface-2 text-muted',
    accent: 'border-accent/30 bg-accent/10 text-accent',
  };
  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneMap[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
