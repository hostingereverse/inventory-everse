/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Simple, clean color scheme
        primary: {
          50: '#f0f0f0',
          100: '#e0e0e0',
          200: '#d0d0d0',
          300: '#b0b0b0',
          400: '#909090',
          500: '#2563eb', // Simple blue
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
        },
      },
    },
  },
  plugins: [],
};

