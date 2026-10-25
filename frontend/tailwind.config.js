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
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        bubble: '16px',
        'bubble-mine':   '18px 18px 4px 18px',
        'bubble-theirs': '18px 18px 18px 4px',
      },
      animation: {
        'dot-bounce':  'dotBounce 1.4s infinite ease-in-out both',
        'fade-in':     'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':    'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-up':   'springUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-dot':   'pulseDot 2.2s infinite ease-in-out',
        'spring-in':   'springIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in':      'popIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pill-bounce': 'pillBounce 2.5s infinite ease-in-out',
      },
      keyframes: {
        dotBounce: {
          '0%, 80%, 100%': { transform: 'scale(0.35)', opacity: '0.4' },
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
        springUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        springIn: {
          '0%':   { opacity: '0', transform: 'scale(0.94) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        popIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '70%':  { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pillBounce: {
          '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
          '50%':      { transform: 'translateX(-50%) translateY(-4px)' },
        },
        pulseDot: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(60, 184, 120, 0.55)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(60, 184, 120, 0)' },
        },
      },
    },
  },
  plugins: [],
};
