// Unified theme configuration for CulinarySeoul
export const themeConfig = {
  // Brand colors using OKLCH for better color management
  colors: {
    brand: {
      primary: {
        DEFAULT: 'oklch(0.57 0.37 145)', // Emerald green
        light: 'oklch(0.67 0.25 145)',
        dark: 'oklch(0.46 0.42 145)',
      },
      secondary: {
        DEFAULT: 'oklch(0.59 0.35 240)', // Blue
        light: 'oklch(0.69 0.3 240)',
        dark: 'oklch(0.5 0.4 240)',
      },
      accent: {
        DEFAULT: 'oklch(0.73 0.22 85)', // Amber
        light: 'oklch(0.83 0.17 85)',
        dark: 'oklch(0.63 0.27 85)',
      },
    },
    semantic: {
      success: 'oklch(0.57 0.37 145)',
      warning: 'oklch(0.73 0.22 85)',
      error: 'oklch(0.63 0.27 27)',
      info: 'oklch(0.59 0.35 240)',
    },
    dashboard: {
      company: 'oklch(0.55 0.37 273)', // Indigo
      brand: 'oklch(0.58 0.34 158)', // Emerald
      store: 'oklch(0.59 0.35 240)', // Blue
    },
  },

  // Spacing scale
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Border radius
  radius: {
    none: '0',
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Typography
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
  },

  // Shadows
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Animation durations
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },
};

// CSS custom properties generator
export function generateCSSVariables(isDark = false) {
  const vars: Record<string, string> = {};

  // Base colors
  vars['--background'] = isDark ? 'oklch(0.2303 0.0125 264.2926)' : 'oklch(0.9824 0.0013 286.3757)';
  vars['--foreground'] = isDark ? 'oklch(0.9219 0 0)' : 'oklch(0.3211 0 0)';

  // Card and popover
  vars['--card'] = isDark ? 'oklch(0.321 0.0078 223.6661)' : 'oklch(1 0 0)';
  vars['--card-foreground'] = isDark ? 'oklch(0.9219 0 0)' : 'oklch(0.3211 0 0)';
  vars['--popover'] = vars['--card'];
  vars['--popover-foreground'] = vars['--card-foreground'];

  // Primary colors
  vars['--primary'] = themeConfig.colors.brand.primary.DEFAULT;
  vars['--primary-foreground'] = 'oklch(1 0 0)';

  // Secondary colors
  vars['--secondary'] = themeConfig.colors.brand.secondary.DEFAULT;
  vars['--secondary-foreground'] = 'oklch(1 0 0)';

  // Muted colors
  vars['--muted'] = isDark ? 'oklch(0.3867 0 0)' : 'oklch(0.8828 0.0285 98.1033)';
  vars['--muted-foreground'] = isDark ? 'oklch(0.7155 0 0)' : 'oklch(0.5382 0 0)';

  // Accent colors
  vars['--accent'] = themeConfig.colors.brand.accent.DEFAULT;
  vars['--accent-foreground'] = isDark ? 'oklch(0.9219 0 0)' : 'oklch(0.3211 0 0)';

  // Destructive colors
  vars['--destructive'] = themeConfig.colors.semantic.error;
  vars['--destructive-foreground'] = 'oklch(1 0 0)';

  // Border and input
  vars['--border'] = isDark ? 'oklch(0.3867 0 0)' : 'oklch(0.8699 0 0)';
  vars['--input'] = vars['--border'];
  vars['--ring'] = vars['--primary'];

  // Brand colors
  vars['--culinary-emerald'] = themeConfig.colors.brand.primary.DEFAULT;
  vars['--culinary-purple'] = themeConfig.colors.brand.secondary.DEFAULT;
  vars['--culinary-amber'] = themeConfig.colors.brand.accent.DEFAULT;

  // Dashboard colors
  vars['--company-primary'] = themeConfig.colors.dashboard.company;
  vars['--brand-primary'] = themeConfig.colors.dashboard.brand;
  vars['--store-primary'] = themeConfig.colors.dashboard.store;

  // Status colors
  vars['--color-success'] = themeConfig.colors.semantic.success;
  vars['--color-warning'] = themeConfig.colors.semantic.warning;
  vars['--color-error'] = themeConfig.colors.semantic.error;
  vars['--color-info'] = themeConfig.colors.semantic.info;

  // Chart colors
  vars['--chart-1'] = themeConfig.colors.brand.primary.DEFAULT;
  vars['--chart-2'] = themeConfig.colors.brand.secondary.DEFAULT;
  vars['--chart-3'] = themeConfig.colors.brand.accent.DEFAULT;
  vars['--chart-4'] = themeConfig.colors.dashboard.company;
  vars['--chart-5'] = themeConfig.colors.dashboard.brand;

  // Radius
  vars['--radius'] = themeConfig.radius.DEFAULT;

  return vars;
}
