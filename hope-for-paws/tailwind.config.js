/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          100: '#e2d6cb', // light beige
          600: '#8B5A2B', // brown
          700: '#6F4C3E', // darker brown
          800: '#4E3B31', // even darker brown
        },
        beige: {
          100: '#f5f0e1', // beige
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}