// Theme Manager for Chatly (Light / Dark mode)

class ThemeManager {
  constructor() {
    this.currentTheme = this.getInitialTheme();
    this.applyTheme(this.currentTheme);
  }

  getInitialTheme() {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('chatly_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Default to dark mode
    return 'dark';
  }

  applyTheme(theme) {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('chatly_theme', theme);
    this.currentTheme = theme;
  }

  toggle() {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    return next;
  }

  isDark() {
    return this.currentTheme === 'dark';
  }
}

export const theme = new ThemeManager();
