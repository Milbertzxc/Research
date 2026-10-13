/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1A365D', dark: '#122642', light: '#2A4A7F' },
        accent: { DEFAULT: '#0D9488', dark: '#0B7C72', light: '#14B8A6' },
        canvas: '#F1F5F9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
