/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bcfd',
          400: '#8196fa',
          500: '#6272f4',
          600: '#4a52e8',
          700: '#3d41d0',
          800: '#3336a8',
          900: '#2e3185',
          950: '#1c1e52',
        },
        gend: {
          blue: '#003189',
          gold: '#c8a951',
          dark: '#0a0e1a',
          darker: '#060910',
          card: '#0d1426',
          border: '#1e2d4f',
        }
      }
    },
  },
  plugins: [],
}
