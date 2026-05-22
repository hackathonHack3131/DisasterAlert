/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cinematic: { black: '#050505', section: '#0A0A0C' },
        accent: { blue: '#0050FF', orange: '#FF6A00', warm: '#FF8C42' },
        neon: { red: '#FF2D55', cyan: '#00F0FF', green: '#39FF14' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(0, 80, 255, 0.35)',
        'glow-red': '0 0 30px rgba(255, 45, 85, 0.4)',
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
  plugins: [],
}
