/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#00274c',
        'blue-gradient': '#1a2c45',
        'light-gray': '#BBBBBB',
        'dark-gray': '#5e6472',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'roboto': ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 