import { motion } from 'framer-motion';

interface BrandProps {
  size?: 'sm' | 'md' | 'lg';
  withWordmark?: boolean;
  tone?: 'auto' | 'light';
}

const SIZES: Record<NonNullable<BrandProps['size']>, { box: string; icon: number; text: string }> = {
  sm: { box: 'h-7 w-7 rounded-lg', icon: 16, text: 'text-sm' },
  md: { box: 'h-9 w-9 rounded-xl', icon: 19, text: 'text-lg' },
  lg: { box: 'h-12 w-12 rounded-2xl', icon: 24, text: 'text-2xl' },
};

export default function Brand({ size = 'md', withWordmark = true, tone = 'auto' }: BrandProps) {
  const cfg = SIZES[size];
  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        whileHover={{ rotate: -8, scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        className={`relative flex shrink-0 items-center justify-center overflow-hidden ${cfg.box} bg-brand-gradient shadow-glow`}
      >
        <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white/30 blur-md" />
        <FlowMark size={cfg.icon} />
      </motion.div>
      {withWordmark && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-display font-semibold tracking-tight ${cfg.text} ${
              tone === 'light' ? 'text-white' : 'text-ink'
            }`}
          >
            Flow<span className="gradient-text">Desk</span>
          </span>
        </div>
      )}
    </div>
  );
}

function FlowMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 6.5C5 5.67 5.67 5 6.5 5h11A1.5 1.5 0 0119 6.5v3A1.5 1.5 0 0117.5 11H10v3.5A1.5 1.5 0 008.5 16H5V6.5z"
        fill="rgba(255,255,255,0.95)"
      />
      <path
        d="M10.5 13.5h7A1.5 1.5 0 0119 15v2.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 019 17.5V15a1.5 1.5 0 011.5-1.5z"
        fill="rgba(255,255,255,0.78)"
      />
    </svg>
  );
}
