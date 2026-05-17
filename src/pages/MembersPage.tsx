import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Crown, FolderKanban, Plus, Search, Sparkles, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { clsx, getAvatarColor, getInitials } from '../lib/utils';
import type { Profile } from '../lib/database.types';

type ProjectSlim = { id: string; name: string; color: string; owner_id: string };
type MemberLite = { id: string; user_id: string; role: 'admin' | 'member' };

export default function MembersPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adminProjects, setAdminProjects] = useState<ProjectSlim[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectMembers, setProjectMembers] = useState<MemberLite[]>([]);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadInitial = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [profilesRes, myMembershipsRes, ownedRes] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name', { ascending: true }),
      supabase.from('project_members').select('project_id, role').eq('user_id', user.id),
      supabase.from('projects').select('id, name, color, owner_id').eq('owner_id', user.id),
    ]);

    if (profilesRes.error || myMembershipsRes.error || ownedRes.error) {
      toast.error('Unable to load workspace members');
      setLoading(false);
      return;
    }

    const adminProjectIds = new Set<string>();
    const ownedIds = new Set<string>();
    (ownedRes.data ?? []).forEach((p) => {
      adminProjectIds.add(p.id);
      ownedIds.add(p.id);
    });
    (myMembershipsRes.data ?? []).forEach((m) => {
      if (m.role === 'admin') adminProjectIds.add(m.project_id);
    });

    const adminProjectIdArr = Array.from(adminProjectIds);
    let manageable: ProjectSlim[] = [];
    if (adminProjectIdArr.length > 0) {
      const { data: projData } = await supabase
        .from('projects')
        .select('id, name, color, owner_id')
        .in('id', adminProjectIdArr)
        .order('name', { ascending: true });
      manageable = (projData as ProjectSlim[]) ?? [];
    }

    setProfiles((profilesRes.data as Profile[]) ?? []);
    setAdminProjects(manageable);
    if (manageable.length > 0 && !selectedProjectId) {
      setSelectedProjectId(manageable[0].id);
    }
    setLoading(false);
  }, [user, selectedProjectId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadProjectMembers = useCallback(async () => {
    if (!selectedProjectId) {
      setProjectMembers([]);
      return;
    }
    const { data, error } = await supabase
      .from('project_members')
      .select('id, user_id, role')
      .eq('project_id', selectedProjectId);
    if (error) {
      toast.error('Unable to load project members');
      return;
    }
    setProjectMembers((data as MemberLite[]) ?? []);
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjectMembers();
  }, [loadProjectMembers]);

  const selectedProject = useMemo(
    () => adminProjects.find((p) => p.id === selectedProjectId) ?? null,
    [adminProjects, selectedProjectId]
  );

  const memberByUserId = useMemo(() => {
    const map = new Map<string, MemberLite>();
    for (const m of projectMembers) map.set(m.user_id, m);
    return map;
  }, [projectMembers]);

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...profiles].sort((a, b) => {
      if (a.id === user?.id) return -1;
      if (b.id === user?.id) return 1;
      const aIn = memberByUserId.has(a.id);
      const bIn = memberByUserId.has(b.id);
      if (aIn !== bIn) return aIn ? -1 : 1;
      return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '');
    });
    if (!q) return sorted;
    return sorted.filter((p) => {
      return (
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      );
    });
  }, [profiles, memberByUserId, query, user?.id]);

  const handleAdd = async (profile: Profile) => {
    if (!selectedProjectId) return;
    setSavingUserId(profile.id);
    const { error } = await supabase.from('project_members').insert({
      project_id: selectedProjectId,
      user_id: profile.id,
      role: 'member',
    });
    setSavingUserId(null);
    if (error) {
      toast.error(error.message || 'Failed to add member');
      return;
    }
    if (user) {
      await supabase.from('activity_log').insert({
        project_id: selectedProjectId,
        user_id: user.id,
        action: 'added member to project',
        entity_type: 'member',
        entity_id: profile.id,
        meta: { email: profile.email },
      });
    }
    toast.success(`Added ${profile.full_name || profile.email}`);
    await loadProjectMembers();
  };

  const handleRemove = async (profile: Profile, membershipId: string) => {
    if (!selectedProjectId) return;
    if (!window.confirm(`Remove ${profile.full_name || profile.email} from this project?`)) return;
    setSavingUserId(profile.id);
    const { error } = await supabase.from('project_members').delete().eq('id', membershipId);
    setSavingUserId(null);
    if (error) {
      toast.error(error.message || 'Failed to remove member');
      return;
    }
    if (user) {
      await supabase.from('activity_log').insert({
        project_id: selectedProjectId,
        user_id: user.id,
        action: 'removed member from project',
        entity_type: 'member',
        entity_id: profile.id,
        meta: { email: profile.email },
      });
    }
    toast.success('Member removed');
    await loadProjectMembers();
  };

  const handleRoleToggle = async (profile: Profile, membershipId: string, currentRole: 'admin' | 'member') => {
    if (!selectedProjectId) return;
    const nextRole: 'admin' | 'member' = currentRole === 'admin' ? 'member' : 'admin';
    setSavingUserId(profile.id);
    const { error } = await supabase
      .from('project_members')
      .update({ role: nextRole })
      .eq('id', membershipId);
    setSavingUserId(null);
    if (error) {
      toast.error(error.message || 'Failed to update role');
      return;
    }
    if (user) {
      await supabase.from('activity_log').insert({
        project_id: selectedProjectId,
        user_id: user.id,
        action: nextRole === 'admin' ? 'promoted member to admin' : 'demoted admin to member',
        entity_type: 'member',
        entity_id: profile.id,
        meta: { role: nextRole },
      });
    }
    toast.success(nextRole === 'admin' ? 'Promoted to admin' : 'Demoted to member');
    await loadProjectMembers();
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
            Manage everyone in your workspace
          </h1>
          <p className="max-w-2xl text-sm text-muted">
            Pick a project, then add or remove anyone from your workspace. Admins can promote others to admin
            or demote them back to member.
          </p>
        </div>
      </motion.div>

      {adminProjects.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center">
          <FolderKanban size={28} className="mx-auto mb-2 text-dim" />
          <p className="text-sm font-semibold text-ink">You don't admin any projects yet</p>
          <p className="mt-1 text-xs text-muted">Create a project first — you'll automatically be its admin.</p>
        </div>
      ) : (
        <>
          <div className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30">
                <FolderKanban size={15} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Manage members of</h2>
                <p className="text-[11px] text-muted">Pick a project you admin to add or remove people below.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {adminProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition',
                    selectedProjectId === p.id
                      ? 'border-accent/40 bg-accent/10 text-ink shadow-glow'
                      : 'border-border bg-bg-soft text-muted hover:text-ink'
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.color || '#3B82F6' }}
                  />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

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
              {filteredProfiles.length} {filteredProfiles.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-border bg-surface p-10 text-center text-sm text-muted">
              Loading workspace members…
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="rounded-3xl border border-border bg-surface p-10 text-center">
              <Users size={28} className="mx-auto mb-2 text-dim" />
              <p className="text-sm font-semibold text-ink">No matching users</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border bg-surface">
              {filteredProfiles.map((profile, idx) => {
                const displayName = profile.full_name?.trim() || profile.email?.split('@')[0] || 'User';
                const membership = memberByUserId.get(profile.id);
                const isYou = profile.id === user?.id;
                const isOwner = selectedProject?.owner_id === profile.id;
                const isMember = !!membership;
                const saving = savingUserId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 sm:px-5',
                      idx !== filteredProfiles.length - 1 && 'border-b border-border'
                    )}
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-on-accent shadow-glow"
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

                    {isOwner ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning">
                        <Crown size={11} /> Owner
                      </span>
                    ) : isMember ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize',
                            membership.role === 'admin'
                              ? 'border-warning/40 bg-warning/10 text-warning'
                              : 'border-border bg-bg-soft text-muted'
                          )}
                        >
                          {membership.role === 'admin' ? <Crown size={10} /> : <Users size={10} />}
                          {membership.role}
                        </span>
                        {!isYou && (
                          <>
                            <button
                              onClick={() => handleRoleToggle(profile, membership.id, membership.role)}
                              disabled={saving}
                              className={clsx(
                                'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-60',
                                membership.role === 'admin'
                                  ? 'border-border bg-surface text-muted hover:text-ink'
                                  : 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/20'
                              )}
                              title={membership.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                            >
                              {membership.role === 'admin' ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                              {membership.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                            <button
                              onClick={() => handleRemove(profile, membership.id)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1 text-[11px] font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-60"
                              title="Remove from project"
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(profile)}
                        disabled={saving || isYou}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-[11px] font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong disabled:opacity-60"
                      >
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
