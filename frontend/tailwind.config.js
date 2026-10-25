/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:            'var(--bg)',
        panel:         'var(--panel)',
        surface:       'var(--panel)',
        line:          'var(--line)',
        text:          'var(--text)',
        muted:         'var(--muted)',
        accent:        'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'on-accent':   'var(--on-accent)',
        in:            'var(--in)',
        out:           'var(--out)',
        'out-text':    'var(--out-text)',
        hover:         'var(--hover)',
        online:        'var(--online)',
        // Semantic aliases
        mine:          'var(--out)',
        'mine-text':   'var(--out-text)',
        theirs:        'var(--in)',
        'theirs-text': 'var(--text)',
        'header-bg':   'var(--panel)',
        'header-text': 'var(--text)',
        'header-sub':  'var(--muted)',
        'input-bg':    'var(--bg)',
        'sidebar-hover':'var(--hover)',
        'sidebar-active':'var(--accent-soft)',
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        bubble: '16px',
        'bubble-mine':   '16px 16px 4px 16px',
        'bubble-theirs': '16px 16px 16px 4px',
      },
      animation: {
        'dot-bounce':  'dotBounce 1.4s infinite ease-in-out both',
        'fade-in':     'fadeIn 0.15s ease-out',
        'slide-up':    'slideUp 0.2s ease-out',
        'pulse-dot':   'pulseDot 2s infinite',
        'spring-in':   'springIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in':      'popIn 0.24s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pill-bounce': 'pillBounce 2.5s infinite ease-in-out',
      },
      keyframes: {
        dotBounce: {
          '0%, 80%, 100%': { transform: 'scale(0.3)', opacity: '0.4' },
          '40%':            { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        springIn: {
          '0%':   { opacity: '0', transform: 'scale(0.92) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        popIn: {
          '0%':   { opacity: '0', transform: 'scale(0.5)' },
          '70%':  { transform: 'scale(1.15)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pillBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        pulseDot: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(60, 184, 120, 0.5)' },
          '50%':      { boxShadow: '0 0 0 5px rgba(60, 184, 120, 0)' },
        },
      },
    },
  },
  plugins: [],
};
