/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:             '#121212',
        surface:        '#000000',
        line:           '#262626',
        accent:         '#2e7d5b',
        'accent-hover': '#26694c',
        'accent-text':  '#f2fff8',
        mine:           '#2e7d5b',
        'mine-text':    '#f2fff8',
        theirs:         '#1c1c1c',
        'theirs-text':  '#e6e6e6',
        muted:          '#8f8f8f',
        'header-bg':    '#1e4d3b',
        'header-text':  '#e8f6ee',
        'header-sub':   '#a9d3bc',
        online:         '#9fd8b7',
        'input-bg':     '#121212',
        'sidebar-item': '#111111',
        'sidebar-hover':'#1a1a1a',
        'sidebar-active':'#0d2b1f',
      },
      fontFamily: {
        sans: ['Nunito', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        bubble: '18px',
        'bubble-mine':   '18px 18px 4px 18px',
        'bubble-theirs': '18px 18px 18px 4px',
      },
      animation: {
        'dot-bounce': 'dotBounce 1.4s infinite ease-in-out both',
        'fade-in':    'fadeIn 0.15s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'pulse-dot':  'pulseDot 2s infinite',
      },
      keyframes: {
        dotBounce: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: '0.3' },
          '40%':            { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(159, 216, 183, 0.5)' },
          '50%':      { boxShadow: '0 0 0 5px rgba(159, 216, 183, 0)' },
        },
      },
    },
  },
  plugins: [],
};
