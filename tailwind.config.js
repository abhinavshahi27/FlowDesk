/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        'bg-soft': 'rgb(var(--bg-soft) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        ink: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        dim: 'rgb(var(--text-dim) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-2': 'rgb(var(--accent-2) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        'on-accent': 'rgb(var(--on-accent) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent) / 0.18), 0 8px 30px -8px rgb(var(--accent) / 0.35)',
        'glow-strong': '0 0 0 1px rgb(var(--accent) / 0.30), 0 12px 40px -6px rgb(var(--accent) / 0.55)',
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.18)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
        'panel-gradient':
          'radial-gradient(120% 90% at 0% 0%, rgb(var(--accent) / 0.10) 0%, transparent 55%), radial-gradient(120% 90% at 100% 100%, rgb(var(--accent-2) / 0.12) 0%, transparent 60%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--accent) / 0.55)' },
          '50%': { boxShadow: '0 0 0 8px rgb(var(--accent) / 0)' },
        },
        'icon-pop': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bell: {
          '0%, 100%': { transform: 'rotate(0)' },
          '20%': { transform: 'rotate(-12deg)' },
          '40%': { transform: 'rotate(10deg)' },
          '60%': { transform: 'rotate(-6deg)' },
          '80%': { transform: 'rotate(4deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-out infinite',
        'icon-pop': 'icon-pop 1.6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        bell: 'bell 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
