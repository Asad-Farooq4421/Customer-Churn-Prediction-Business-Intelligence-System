/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B192C', // Dark Base Navy
          800: '#1E3E62', // Deep Navy
          700: '#14273E', // Card Borders / Dark Accents
          600: '#2A4E78', // Light Navy Blue
          500: '#3B608C', // Interactive Navy Accent
          100: '#EBF1F6', // Soft Tint Light Navy
        },
      },
    },
  },
  plugins: [],
};