/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          light: 'var(--color-secondary-light)',
        },
        accent: {
          tan: {
            DEFAULT: 'var(--color-accent-tan)',
            hover: 'var(--color-accent-tan-hover)',
            light: 'var(--color-accent-tan-light)',
          },
          terracotta: {
            DEFAULT: 'var(--color-accent-terracotta)',
            hover: 'var(--color-accent-terracotta-hover)',
            light: 'var(--color-accent-terracotta-light)',
          }
        },
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        border: 'var(--color-border)',
        'focus-ring': 'var(--color-focus-ring)',
        slate: {
          900: '#0f172a',
          800: '#1e293b',
        },
      },
    },
  },
  plugins: [],
}
