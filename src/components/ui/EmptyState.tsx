import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tips?: string[];
}

export default function EmptyState({ icon: Icon, title, description, action, tips }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-on-accent shadow-glow">
        <span className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
        <Icon size={24} />
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-ink">{title}</h3>
      <p className="mb-5 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action}
      {tips && tips.length > 0 && (
        <ul className="mt-6 grid w-full max-w-md gap-2 text-left">
          {tips.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
