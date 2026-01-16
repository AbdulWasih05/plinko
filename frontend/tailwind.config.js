/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0C15', // Dark cosmic
        surface: '#1A1C29',   // Slightly lighter
        primary: '#7C3AED',   // Deep Purple
        secondary: '#10B981', // Neon Green
        accent: '#F43F5E',    // Neon Pink/Red
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
