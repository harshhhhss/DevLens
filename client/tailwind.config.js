/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3ccff',
          300: '#80a8ff',
          400: '#4d7eff',
          500: '#265bf5',
          600: '#1a45d1',
          700: '#1636a6',
          800: '#152c82',
          900: '#152869',
        },
      },
    },
  },
  plugins: [],
};
