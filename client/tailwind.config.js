/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: { DEFAULT: '#FDFCFC', pure: '#FFFFFF', muted: '#F3F4F6' },
        surface: { DEFAULT: '#111113', highlight: '#1A1A1E', input: '#27272A', border: '#2E2E32' },
        ink: { base: '#111827', muted: '#6B7280', onDark: '#FFFFFF', mutedOnDark: '#A1A1AA' },
        ai: { DEFAULT: '#7C3AED', hover: '#6D28D9', glow: '#8B5CF6', dim: 'rgba(124, 58, 237, 0.1)' },
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Switzer', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Author', 'serif'],
      },
      boxShadow: {
        'monolith': '0 20px 40px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.05)',
        'glow': '0 0 20px rgba(124, 58, 237, 0.3)',
        'violet-glow': '0 0 24px rgba(124, 58, 237, 0.25)',
      },
      borderRadius: { 'card': '16px', 'input': '8px' },
      animation: {
        'lift': 'lift 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'pulse-glow': 'pulse-glow 3s infinite',
        'orbit': 'orbit 20s linear infinite',
        'orbit-reverse': 'orbit-reverse 25s linear infinite',
        'cognitive-pulse': 'cognitive-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        lift: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        'pulse-glow': { '0%, 100%': { boxShadow: '0 0 0px rgba(124, 58, 237, 0)' }, '50%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' } },
        orbit: { from: { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' }, to: { transform: 'rotate(360deg) translateX(120px) rotate(-360deg)' } },
        'orbit-reverse': { from: { transform: 'rotate(360deg) translateX(160px) rotate(-360deg)' }, to: { transform: 'rotate(0deg) translateX(160px) rotate(0deg)' } },
        'cognitive-pulse': { '0%, 100%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0.4)' }, '50%': { boxShadow: '0 0 0 10px rgba(124, 58, 237, 0)' } }
      }
    },
  },
  plugins: [],
}