/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f1115',
          raised: '#16191f',
          sunken: '#0b0d11',
        },
        accent: '#4fd1c5',
        outline: '#262a32',
      },
      boxShadow: {
        panel: '0 12px 30px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};

