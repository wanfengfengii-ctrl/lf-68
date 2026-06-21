/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        earth: {
          50: '#fdf8f3',
          100: '#f9efe3',
          200: '#f2dcc4',
          300: '#e8c49c',
          400: '#dca76e',
          500: '#d18b47',
          600: '#c3723c',
          700: '#a35834',
          800: '#834731',
          900: '#6b3b2a',
          950: '#3a1d14',
        },
        moss: {
          50: '#f6f7f3',
          100: '#e9ebe1',
          200: '#d4d8c4',
          300: '#b7bd9d',
          400: '#98a076',
          500: '#7d865a',
          600: '#626a46',
          700: '#4d5339',
          800: '#404431',
          900: '#373a2b',
          950: '#1b1e14',
        },
        indigo: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        parchment: {
          50: '#fefdfb',
          100: '#fdfaf5',
          200: '#faf5eb',
          300: '#f5eddc',
          400: '#ede3cc',
          500: '#e5d7b6',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'wood': '0 4px 6px -1px rgba(139, 69, 19, 0.2), 0 2px 4px -1px rgba(139, 69, 19, 0.1)',
        'card': '0 10px 15px -3px rgba(85, 107, 47, 0.15), 0 4px 6px -2px rgba(85, 107, 47, 0.1)',
      },
      backgroundImage: {
        'wood-grain': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='%23f5eddc'/%3E%3Cpath d='M0 20c10-5 20 5 30 0s20-5 30 0 20 5 30 0v5c-10 5-20-5-30 0s-20 5-30 0-20-5-30 0z' fill='%23e5d7b6' opacity='0.3'/%3E%3C/svg%3E\")",
        'parchment': "linear-gradient(135deg, #fdfaf5 0%, #faf5eb 50%, #f5eddc 100%)",
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideUp': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
