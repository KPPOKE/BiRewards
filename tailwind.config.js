/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#aa7946',
          50: '#faf6f1',
          100: '#f2e9dd',
          200: '#e4d1b7',
          300: '#d3b68e',
          400: '#b88552',
          500: '#aa7946',
          600: '#96683b',
          700: '#7d5332',
          800: '#66432c',
          900: '#543826',
        },
      },
    },
  },
  plugins: [],
};