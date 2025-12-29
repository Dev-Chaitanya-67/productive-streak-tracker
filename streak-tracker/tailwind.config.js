/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        logo: ['Space Grotesk', 'sans-serif'], // <--- NEW FONT
      },
      colors: {
        neon: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', 
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
          accent: '#2dd4bf', 
        }
      },
      boxShadow: {
        'neon-glow': '0 0 15px rgba(16, 185, 129, 0.5)',
        'neon-pop': '0 0 20px rgba(45, 212, 191, 0.6)',
      }
    },
  },
  plugins: [],
}