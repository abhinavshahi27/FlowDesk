import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Crown, Search, Sparkles, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { clsx, getAvatarColor, getInitials } from '../lib/utils';
import type { ProjectMember, Profile } from '../lib/database.types';

type ProjectSlim = { id: string; name: string; color: string; owner_id: string };
type MembershipRow = ProjectMember & { profile: Profile; project: ProjectSlim };

interface MemberRow {
  profile: Profile;
  memberships: MembershipRow[];
}

export default function MembersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: myMemberships, error: myErr } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);
    if (myErr) {
      toast.error('Unable to load workspace members');
      setLoading(false);
      return;
    }

    const projectIds = Array.from(new Set((myMemberships ?? []).map((m) => m.project_id)));
    if (projectIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('project_members')
      .select('*, profile:profiles(*), project:projects(id,name,color,owner_id)')
      .in('project_id', projectIds);

    if (error || !data) {
      toast.error('Unable to load workspace members');
      setLoading(false);
      return;
    }

    const grouped = new Map<string, MemberRow>();
    for (const row of data as MembershipRow[]) {
      if (!row.profile) continue;
      const existing = grouped.get(row.profile.id);
      if (existing) existing.memberships.push(row);
      else grouped.set(row.profile.id, { profile: row.profile, memberships: [row] });
    }

    const sorted = Array.from(grouped.values()).sort((a, b) => {
      if (a.profile.id === user.id) return -1;
      if (b.profile.id === user.id) return 1;
      return (a.profile.full_name || a.profile.email || '').localeCompare(b.profile.full_name || b.profile.email || '');
    });

    setRows(sorted);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ profile }) => {
      const name = (profile.full_name || '').toLowerCase();
      const email = (profile.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [rows, query]);

  const updateRole = async (membershipId: string, projectId: string, nextRole: 'admin' | 'member') => {
    setSavingId(membershipId);
    const { error } = await supabase
      .from('project_members')
      .update({ role: nextRole })
      .eq('id', membershipId);
    setSavingId(null);

    if (error) {
      toast.error(error.message || 'Failed to update role');
      return;
    }

    if (user) {
      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user.id,
        action: nextRole === 'admin' ? 'promoted member to admin' : 'demoted admin to member',
        entity_type: 'member',
        meta: { role: nextRole },
      });
    }

    toast.success(nextRole === 'admin' ? 'Promoted to admin' : 'Demoted to member');
    await load();
  };

  return (
    <div className="space-y-6 p-5 lg:p-7">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6"
      >
        <span className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles size={12} /> Members
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Everyone in your workspace
          </h1>
          <p className="max-w-2xl text-sm text-muted">
            People you share projects with. Promote teammates to admin so they can manage members and tasks, or
            demote back to member.
          </p>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
        <Search size={14} className="text-dim" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          className="flex-1 bg-transparent text-sm text-ink placeholder-dim outline-none"
        />
        <span className="rounded-md border border-border bg-bg-soft px-2 py-0.5 text-[11px] text-dim">
          {filtered.length} {filtered.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center text-sm text-muted">
          Loading workspace members…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center">
          <Users size={28} className="mx-auto mb-2 text-dim" />
          <p className="text-sm font-semibold text-ink">No members yet</p>
          <p className="mt-1 text-xs text-muted">
            Invite people from a project's Members tab to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ profile, memberships }) => {
            const isYou = profile.id === user?.id;
            const displayName = profile.full_name?.trim() || profile.email?.split('@')[0] || 'User';
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-border bg-surface p-4 sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-on-accent shadow-glow"
                    style={{ backgroundColor: getAvatarColor(displayName) }}
                  >
                    {getInitials(displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                      {isYou && (
                        <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                          You
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted">{profile.email}</p>
                  </div>
                  <span className="hidden rounded-full border border-border bg-bg-soft px-2.5 py-1 text-[11px] text-muted sm:inline-flex">
                    {memberships.length} {memberships.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {memberships.map((m) => {
                    const myMembership = rows
                      .find((r) => r.profile.id === user?.id)
                      ?.memberships.find((x) => x.project_id === m.project_id);
                    const iAmAdminHere =
                      myMembership?.role === 'admin' || m.project.owner_id === user?.id;
                    const targetIsOwner = m.user_id === m.project.owner_id;
                    const isMe = m.user_id === user?.id;
                    const canToggle = iAmAdminHere && !targetIsOwner && !isMe;
                    const nextRole: 'admin' | 'member' = m.role === 'admin' ? 'member' : 'admin';
                    const saving = savingId === m.id;

                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 rounded-2xl bg-bg-soft px-3 py-2.5"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: m.project.color || '#3B82F6' }}
                        />
                        <p className="min-w-0 flex-1 truncate text-sm text-ink">{m.project.name}</p>

                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize',
                            m.role === 'admin'
                              ? 'border-warning/40 bg-warning/10 text-warning'
                              : 'border-border bg-surface text-muted'
                          )}
                        >
                          {m.role === 'admin' ? <Crown size={10} /> : <Users size={10} />}
                          {targetIsOwner ? 'owner' : m.role}
                        </span>

                        {canToggle && (
                          <button
                            onClick={() => updateRole(m.id, m.project_id, nextRole)}
                            disabled={saving}
                            className={clsx(
                              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-60',
                              nextRole === 'admin'
                                ? 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/20'
                                : 'border-border bg-surface text-muted hover:text-ink'
                            )}
                            title={nextRole === 'admin' ? 'Promote to admin' : 'Demote to member'}
                          >
                            {nextRole === 'admin' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                            {nextRole === 'admin' ? 'Promote' : 'Demote'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
