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
        // Admin Accent: Electric Cobalt (Blue) instead of Violet
        ai: { DEFAULT: '#2E5BFF', hover: '#1E40AF', glow: '#60A5FA', dim: 'rgba(46, 91, 255, 0.1)' },
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
        'glow': '0 0 20px rgba(46, 91, 255, 0.3)',
      },
      borderRadius: { 'card': '16px', 'input': '8px' },
    },
  },
  plugins: [],
}