/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6ffee',
          100: '#b3ffd6',
          200: '#80ffbe',
          300: '#4dffa6',
          400: '#1aff8e',
          500: '#00e673',
          600: '#00cc66',
          700: '#00b359',
          800: '#00994d',
          900: '#008040',
          950: '#006633',
        },
        success: {
          500: '#00e673',
          600: '#00cc66',
        },
        danger: {
          500: '#ff4d4d',
          600: '#ff3333',
        },
        dark: {
          100: '#2e3338',
          200: '#252a30',
          300: '#1e2328',
          400: '#151a1e',
          500: '#0d1117',
          600: '#0a0d12',
          700: '#06090d',
          800: '#030508',
          900: '#010203',
        },
      },
      backgroundColor: {
        'dark-gradient': 'linear-gradient(to right, #0d1117, #1a1f25)',
      },
      boxShadow: {
        'neon-green': '0 0 5px rgba(0, 230, 115, 0.5), 0 0 20px rgba(0, 230, 115, 0.3)',
        'neon-glow': '0 0 10px rgba(0, 230, 115, 0.7), 0 0 30px rgba(0, 230, 115, 0.5), 0 0 50px rgba(0, 230, 115, 0.3)',
      },
    },
  },
  plugins: [],
}; 