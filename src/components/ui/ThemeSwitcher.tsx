import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Palette } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { clsx } from '../../lib/utils';

interface ThemeSwitcherProps {
  variant?: 'icon' | 'inline';
  align?: 'left' | 'right';
}

export default function ThemeSwitcher({ variant = 'icon', align = 'right' }: ThemeSwitcherProps) {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (variant === 'inline') {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {themes.map((option) => {
          const active = option.id === theme;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={clsx(
                'group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all',
                active
                  ? 'border-accent/60 bg-accent/10 shadow-glow'
                  : 'border-border bg-surface hover:border-border-strong hover:bg-surface-2'
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-border-strong/60">
                <Swatches colors={option.swatch} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{option.name}</p>
                <p className="text-xs text-muted truncate">{option.tagline}</p>
              </div>
              {active && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-on-accent">
                  <Check size={13} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition hover:border-accent/60 hover:text-accent"
        aria-label="Change theme"
      >
        <Palette
          size={15}
          className="transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className={clsx(
              'absolute top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-elevated p-2 shadow-glow-strong',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            <div className="px-2 pt-1 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">Workspace theme</p>
            </div>
            <div className="space-y-1">
              {themes.map((option) => {
                const active = option.id === theme;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setTheme(option.id);
                      setOpen(false);
                    }}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition',
                      active
                        ? 'bg-accent/10 ring-1 ring-accent/40'
                        : 'hover:bg-surface-2'
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-border">
                      <Swatches colors={option.swatch} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{option.name}</p>
                      <p className="text-[11px] text-muted truncate">{option.tagline}</p>
                    </div>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent">
                        <Check size={11} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Swatches({ colors }: { colors: [string, string, string] }) {
  return (
    <div className="flex h-5 w-5 overflow-hidden rounded-full">
      {colors.map((c, i) => (
        <span key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}
