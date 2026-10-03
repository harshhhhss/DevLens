/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Preflight applies fontFamily.sans to <html>, so UI text picks up Inter
        // automatically. System fonts remain as fallbacks while webfonts load.
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      // Explicit type scale: 12/14 for meta, 14 body, 16 inputs, 20-36 headings.
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.5rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
      },
      colors: {
        // Semantic surface and text tokens. Everything structural resolves to
        // one of these six, so a theme change is a change here rather than a
        // sweep through every component.
        canvas: '#0A0A0A', // page background
        surface: '#141414', // cards and panels
        edge: 'rgba(255,255,255,0.08)', // borders and dividers
        raised: '#1F1F1F', // inset chips, tracks, subtle fills
        'raised-hover': '#2A2A2A', // the same fills on hover
        fg: '#F2F2F2', // primary text
        'fg-hover': '#D9D9D9', // primary button hover
        muted: '#94949C', // secondary text
        subtle: '#6B6B70', // tertiary text and meta

        // The one brand colour, spent deliberately: the logo mark, section
        // labels and step numerals. Primary buttons are white on black, not
        // accent-coloured, which is what keeps the accent meaningful.
        accent: '#E0A030',

        // Severity is a fixed four-step scale, ordered by lightness as well as
        // hue so it survives colour-blindness and greyscale.
        severity: {
          critical: '#f87171',
          high: '#fb923c',
          medium: '#facc15',
          low: '#38bdf8',
        },

        // Outcome colours. One green and one red, so "good" and "bad" never
        // arrive as two different greens depending on the component.
        ok: '#34d399',
        danger: '#f87171',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 8px 24px -12px rgb(0 0 0 / 0.5)',
        'card-hover': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 12px 32px -12px rgb(0 0 0 / 0.6)',
        glow: '0 0 0 1px rgb(124 58 237 / 0.3), 0 8px 24px -8px rgb(124 58 237 / 0.45)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
    },
  },
  plugins: [],
};
