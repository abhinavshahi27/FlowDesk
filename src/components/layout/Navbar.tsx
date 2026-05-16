import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarColor, getInitials } from '../../lib/utils';
import ThemeSwitcher from '../ui/ThemeSwitcher';

interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
}

export default function Navbar({ onMenuClick, title, subtitle }: NavbarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = profile?.full_name || 'User';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:border-accent/40 hover:text-ink lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={16} />
      </button>

      {title && (
        <div className="hidden min-w-0 sm:block">
          <h1 className="truncate font-display text-base font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="truncate text-[11px] text-muted">{subtitle}</p>}
        </div>
      )}

      <div className="flex-1" />

      <div className="hidden items-center gap-2 rounded-xl border border-border bg-bg-soft px-3 py-1.5 text-xs text-muted md:flex">
        <Search size={13} />
        <input
          type="text"
          placeholder="Quick search (coming soon)"
          className="w-48 bg-transparent text-xs text-ink placeholder-dim outline-none"
          disabled
        />
        <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-dim">
          ⌘K
        </span>
      </div>

      <button
        type="button"
        className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-accent"
        aria-label="Notifications"
      >
        <Bell size={15} className="transition group-hover:animate-bell" />
        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-surface" />
      </button>

      <ThemeSwitcher />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((open) => !open)}
          className="group flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5 transition hover:border-accent/40"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-on-accent"
            style={{ backgroundColor: getAvatarColor(displayName) }}
          >
            {getInitials(displayName)}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold leading-tight text-ink">{displayName}</p>
            <p className="text-[10px] leading-tight text-dim">Workspace member</p>
          </div>
          <ChevronDown
            size={12}
            className="hidden text-dim transition group-hover:text-ink sm:block"
          />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border bg-elevated p-1.5 shadow-glow-strong"
              role="menu"
            >
              <div className="border-b border-border px-3 py-3">
                <p className="text-sm font-semibold text-ink">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{profile?.email}</p>
              </div>
              <div className="py-1">
                <MenuItem
                  icon={<User size={13} />}
                  label="Profile"
                  onClick={() => {
                    navigate('/settings');
                    setDropdownOpen(false);
                  }}
                />
                <MenuItem
                  icon={<Settings size={13} />}
                  label="Settings & themes"
                  onClick={() => {
                    navigate('/settings');
                    setDropdownOpen(false);
                  }}
                />
              </div>
              <div className="border-t border-border pt-1">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-danger transition hover:bg-danger/10"
                  role="menuitem"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-ink"
      role="menuitem"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 text-muted">
        {icon}
      </span>
      {label}
    </button>
  );
}
