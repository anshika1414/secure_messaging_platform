/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        signal: {
          blue: '#2c6bed',
          'blue-hover': '#2459c9',
          'blue-light': '#eaf1ff',
          dark: '#121214',
          'dark-panel': '#1b1c1e',
          'dark-surface': '#25272a',
          'dark-bubble': '#2a2d32',
          'dark-border': '#2d3035',
          light: '#f5f6f8',
          'light-panel': '#ffffff',
          'light-surface': '#f0f2f5',
          'light-bubble': '#e2e8f0',
          'light-border': '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
