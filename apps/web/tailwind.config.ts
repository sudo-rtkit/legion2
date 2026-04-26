import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        base: '#0a0a0f',
        elevated: '#14141c',
        'elevated-2': '#1c1c28',
        // Borders
        'chrome-subtle': '#1f1f2e',
        chrome: '#2a2a3e',
        'chrome-strong': '#3d3d57',
        // Text
        ink: '#e8e8f5',
        'ink-2': '#9595b0',
        'ink-3': '#5a5a72',
        // Accent
        lime: '#4ade80',
        'lime-hover': '#22c55e',
        warn: '#fbbf24',
        danger: '#ef4444',
        // Legacy shadcn compat (used by existing primitives)
        background: '#0a0a0f',
        foreground: '#e8e8f5',
        card: { DEFAULT: '#14141c', foreground: '#e8e8f5' },
        border: '#2a2a3e',
        input: '#1c1c28',
        ring: '#4ade80',
        muted: { DEFAULT: '#1c1c28', foreground: '#9595b0' },
        accent: { DEFAULT: '#1c1c28', foreground: '#e8e8f5' },
        primary: { DEFAULT: '#4ade80', foreground: '#0a0a0f' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '6px',
        md: '10px',
        lg: '14px',
        full: '9999px',
      },
      boxShadow: {
        'glow-lime': '0 0 12px rgba(74,222,128,0.08)',
        'glow-lime-hover': '0 0 16px rgba(74,222,128,0.20)',
        'glow-lime-strong': '0 0 20px rgba(74,222,128,0.32)',
        'glow-blue': '0 0 8px rgba(96,165,250,0.20)',
        'glow-purple': '0 0 8px rgba(168,85,247,0.20)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
