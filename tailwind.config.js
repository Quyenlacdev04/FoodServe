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
         *  CHAMPAGNE GOLD — Primary Brand Color
         *  Sang trọng, ấm áp, chuyên nghiệp
         * ════════════════════════════════════════════ */
        primary: {
          50:  '#fdfaf3',
          100: '#faf0d7',
          200: '#f4dda8',
          300: '#ecc472',
          400: '#e2a83e',
          500: '#d4952a',   // ← Main brand gold
          600: '#b87a20',
          700: '#965d1c',
          800: '#7a4b1e',
          900: '#663e1d',
          950: '#3a200d',
        },
        /* ════════════════════════════════════════════
         *  EMERALD ACCENT — Fresh, trust, success
         * ════════════════════════════════════════════ */
        accent: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        /* ════════════════════════════════════════════
         *  MIDNIGHT NAVY — Deep Luxury Dark Tones
         * ════════════════════════════════════════════ */
        dark: {
          50:  '#2a2d42',
          100: '#1e2036',
          200: '#171a2e',
          300: '#0f1225',
          400: '#0a0c1a',
          500: '#060814',
        },
        surface: {
          light: '#f8f7f4',
          DEFAULT: '#ffffff',
          dark: '#151729',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 149, 42, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 149, 42, 0.4)' },
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
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow':         '0 0 30px rgba(212, 149, 42, 0.25)',
        'glow-lg':      '0 0 60px rgba(212, 149, 42, 0.35)',
        'glow-xl':      '0 0 100px rgba(212, 149, 42, 0.25)',
        'neon':         '0 0 20px rgba(212, 149, 42, 0.4), 0 0 40px rgba(212, 149, 42, 0.15), 0 0 60px rgba(212, 149, 42, 0.08)',
        'cinema':       '0 25px 60px rgba(0, 0, 0, 0.3)',
        'card':         '0 4px 24px rgba(0, 0, 0, 0.06)',
        'card-hover':   '0 12px 40px rgba(0, 0, 0, 0.12)',
        'card-premium': '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(212, 149, 42, 0.08)',
        'inner-glow':   'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass':        '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'gold':         '0 4px 20px rgba(212, 149, 42, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #0f1225 0%, #151729 25%, #1e2036 50%, #151729 75%, #0f1225 100%)',
      },
    },
  },
  plugins: [],
}
