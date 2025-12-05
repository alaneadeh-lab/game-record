/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Casino theme colors
        felt: '#0d4f2c',
        'felt-light': '#1a6b3d',
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFE44D',
          dark: '#CCAA00',
          glow: 'rgba(255, 215, 0, 0.5)',
        },
        silver: {
          DEFAULT: '#C0C0C0',
          light: '#E8E8E8',
          dark: '#808080',
          glow: 'rgba(192, 192, 192, 0.4)',
        },
        bronze: {
          DEFAULT: '#CD7F32',
          light: '#E6A052',
          dark: '#A65F28',
          glow: 'rgba(205, 127, 50, 0.4)',
        },
        ruby: '#DC143C',
        emerald: '#50C878',
        royal: '#4169E1',
      },
      boxShadow: {
        '3d': '0 10px 30px rgba(0, 0, 0, 0.4), 0 1px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        '3d-hover': '0 20px 50px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'card': '0 8px 20px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'card-hover': '0 15px 35px rgba(0, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3)',
        'glow-silver': '0 0 15px rgba(192, 192, 192, 0.5), 0 0 30px rgba(192, 192, 192, 0.2)',
        'glow-bronze': '0 0 15px rgba(205, 127, 50, 0.5), 0 0 30px rgba(205, 127, 50, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'casino-felt': 'radial-gradient(ellipse at center, #1a6b3d 0%, #0d4f2c 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #FFE44D 50%, #FFD700 100%)',
        'silver-gradient': 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 50%, #E8E8E8 100%)',
        'bronze-gradient': 'linear-gradient(135deg, #E6A052 0%, #CD7F32 50%, #E6A052 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-slow': 'bounce 2s infinite',
        'tilt': 'tilt 0.3s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4)' },
        },
        tilt: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(2deg) scale(1.02)' },
          '100%': { transform: 'rotate(0deg) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
