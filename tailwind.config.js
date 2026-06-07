/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ════════════════════════════════════════════
         *  VIBRANT ORANGE — Primary Brand Color
         *  Năng động, kích thích vị giác, hiện đại và trẻ trung
         * ════════════════════════════════════════════ */
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6b00',   // ← Main brand Orange 2026
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        /* ════════════════════════════════════════════
         *  WARM PEACH / AMBER ACCENT — Complementary Tone
         * ════════════════════════════════════════════ */
        accent: {
          50:  '#fffbf0',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        /* ════════════════════════════════════════════
         *  WARM STONE DARK — Premium warm dark palette
         *  Kết hợp với cam tạo ra vẻ cực sang trọng
         * ════════════════════════════════════════════ */
        dark: {
          50:  '#44403c',
          100: '#292524',
          200: '#1c1917',
          300: '#0c0a09',
          400: '#070504',
          500: '#030202',
        },
        surface: {
          light: '#fafaf9',  // Stone 50 light tone
          DEFAULT: '#ffffff',
          dark: '#1c1917',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 1s infinite',
        'smoke': 'smoke 4s ease-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
        'spin-slow': 'spin 3s linear infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'gradient-flow': 'gradient-flow 8s ease infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'aurora': 'aurora 6s ease-in-out infinite',
        'levitate': 'levitate 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        smoke: {
          '0%': { opacity: '0.6', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-80px) scale(2)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 0, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 107, 0, 0.4)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-flow': {
          '0%': { backgroundPosition: '0% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '100%': { backgroundPosition: '0% 0%' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        aurora: {
          '0%': { backgroundPosition: '0% 50%', opacity: '0.5' },
          '25%': { backgroundPosition: '50% 0%', opacity: '0.8' },
          '50%': { backgroundPosition: '100% 50%', opacity: '0.5' },
          '75%': { backgroundPosition: '50% 100%', opacity: '0.8' },
          '100%': { backgroundPosition: '0% 50%', opacity: '0.5' },
        },
        levitate: {
          '0%, 100%': { transform: 'translateY(0) rotateX(2deg)' },
          '50%': { transform: 'translateY(-12px) rotateX(-2deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow':         '0 0 30px rgba(255, 107, 0, 0.25)',
        'glow-lg':      '0 0 60px rgba(255, 107, 0, 0.35)',
        'glow-xl':      '0 0 100px rgba(255, 107, 0, 0.25)',
        'neon':         '0 0 20px rgba(255, 107, 0, 0.4), 0 0 40px rgba(255, 107, 0, 0.15), 0 0 60px rgba(255, 107, 0, 0.08)',
        'cinema':       '0 25px 60px rgba(0, 0, 0, 0.12)',
        'card':         '0 1px 3px rgba(0,0,0,0.02), 0 4px 24px rgba(0, 0, 0, 0.04)',
        'card-hover':   '0 12px 40px rgba(0, 0, 0, 0.08)',
        'card-premium': '0 4px 16px rgba(0, 0, 0, 0.04), 0 12px 40px rgba(255, 107, 0, 0.06)',
        'inner-glow':   'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        'glass':        '0 8px 32px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'depth-sm':     '0 2px 4px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.03)',
        'depth':        '0 4px 8px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05), 0 16px 40px rgba(0,0,0,0.03)',
        'depth-lg':     '0 8px 16px rgba(0,0,0,0.05), 0 16px 48px rgba(0,0,0,0.06), 0 24px 64px rgba(0,0,0,0.03)',
        '3d':           '0 20px 60px -15px rgba(255, 107, 0, 0.2), 0 10px 20px -10px rgba(0,0,0,0.06)',
        '3d-hover':     '0 30px 80px -15px rgba(255, 107, 0, 0.3), 0 15px 30px -10px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #fffaf5 0%, #fff7ed 25%, #fffbf7 50%, #fff7ed 75%, #fffaf5 100%)',
      },
    },
  },
  plugins: [],
}
