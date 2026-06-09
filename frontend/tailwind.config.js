/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:         '#07080C',
        accent:             '#C9A84C',   // warm gold — primary
        'accent-secondary': '#0BBDCA',  // calm teal — secondary
        gold:               '#C9A84C',
        teal:               '#0BBDCA',
        forest:             '#1B7A51',
        violet: {
          DEFAULT: '#6D28D9',
          light:   '#8B5CF6',
          dark:    '#5B21B6',
        },
        'text-primary':   '#E8E2D8',  // warm cream
        'text-secondary': '#7B7368',  // warm sand
      },
      fontFamily: {
        syne:    ['"Space Grotesk"', 'sans-serif'],
        serif:   ['"DM Serif Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        inter:   ['"Space Grotesk"', 'sans-serif'],
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'shimmer':    'shimmer 4s linear infinite',
        'orb-drift':  'orb-drift 16s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'rise':       'rise 0.7s ease-out both',
      },
    },
  },
  plugins: [],
}
