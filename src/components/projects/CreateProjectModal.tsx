import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Sparkles, X } from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { PROJECT_COLORS, clsx } from '../../lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Too long'),
  description: z.string().max(200, 'Too long').optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export default function CreateProjectModal({ onClose }: Props) {
  const { createProject } = useProjects();
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const name = watch('name');
  const description = watch('description');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const project = await createProject({
      name: data.name,
      description: data.description || '',
      color: selectedColor,
    });
    setIsSubmitting(false);

    if (project) {
      toast.success('Project created');
      onClose();
      navigate(`/projects/${project.id}`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-elevated shadow-glow-strong"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
          <header className="flex items-center justify-between border-b border-border px-6 pb-4 pt-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/30">
                <Sparkles size={15} />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight text-ink">
                  New project
                </h2>
                <p className="text-[11px] text-muted">You become its admin automatically.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted transition hover:bg-surface-2 hover:text-ink"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
                Project name
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="e.g. Q3 Launch Plan"
                className="form-control"
                autoFocus
              />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
                Description
              </label>
              <textarea
                {...register('description')}
                placeholder="A short summary teammates will see in the sidebar."
                rows={3}
                className="form-control resize-none"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted">
                Identifier color
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={clsx(
                      'relative h-9 w-9 rounded-xl transition',
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-offset-elevated ring-accent'
                        : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Choose color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-soft p-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-on-accent shadow-glow"
                style={{ backgroundColor: selectedColor }}
              >
                <FolderKanban size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{name || 'Your project name'}</p>
                <p className="truncate text-[11px] text-muted">
                  {description || 'Preview — your project will appear like this in the sidebar.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-on-accent shadow-glow transition hover:shadow-glow-strong disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-accent/70 border-t-transparent" />
                ) : (
                  'Create project'
                )}
              </button>
            </div>
          </form>

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
            .form-control::placeholder { color: rgb(var(--text-dim)); }
            .form-control:focus {
              outline: none;
              border-color: rgb(var(--accent));
              box-shadow: 0 0 0 3px rgb(var(--accent) / 0.18);
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
