/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          felt: '#0b2b22',
          feltLight: '#12382c',
          gold: '#dfb76c',
          goldLight: '#f3d294',
          goldDark: '#b89047',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(223, 183, 108, 0.4)',
        'neon-glow': '0 0 15px rgba(34, 197, 94, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'radial-gradient-felt': 'radial-gradient(circle at center, #12382c 0%, #0b2b22 100%)',
      }
    },
  },
  plugins: [],
}
