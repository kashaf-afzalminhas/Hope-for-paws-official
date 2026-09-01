/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#2C1810',
        'ink-soft': '#6B4A38',
        clay: '#A07855',
        'clay-deep': '#8A6A4D',
        sand: '#E5D9C8',
        'sand-light': '#F5EFE6',
        cream: '#F8F4EA',
        like: '#EF4444',
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
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -1px rgba(44, 24, 16, 0.06), 0 1px 4px -1px rgba(44, 24, 16, 0.04)',
        'warm-md': '0 6px 20px -2px rgba(44, 24, 16, 0.08), 0 2px 6px -1px rgba(44, 24, 16, 0.04)',
        'warm-lg': '0 12px 28px -4px rgba(44, 24, 16, 0.14), 0 4px 10px -2px rgba(44, 24, 16, 0.06)',
      },
      keyframes: {
        shine: {
          '100%': { transform: 'translateX(100%) skewX(-12deg)' }
        },
        heartPop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        shine: 'shine 1.5s ease-in-out infinite',
        heartPop: 'heartPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}