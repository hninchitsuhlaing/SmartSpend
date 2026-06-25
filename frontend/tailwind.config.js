/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        surface: {
          DEFAULT: '#ffffff',
          50: '#f8faff',
          100: '#f0f2ff',
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(99,102,241,0.08), 0 8px 24px rgba(99,102,241,0.06)',
        'card-hover': '0 4px 12px rgba(99,102,241,0.15), 0 16px 40px rgba(99,102,241,0.1)',
      }
    },
  },
  plugins: [],
}
