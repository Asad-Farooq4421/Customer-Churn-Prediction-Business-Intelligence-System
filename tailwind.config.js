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
          900: '#0B192C',
          800: '#1E3E62',
          700: '#14273E',
          600: '#2A4E78',
          500: '#3B608C',
          100: '#EBF1F6',
        },
      },
    },
  },
  plugins: [],
};