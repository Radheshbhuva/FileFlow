/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#0c1823',
          900: '#12263a',
          800: '#193153',
          700: '#22406f',
          600: '#2052a0'
        }
      },
      boxShadow: {
        soft: '0 25px 50px -25px rgba(15, 23, 42, 0.6)'
      }
    }
  },
  plugins: []
};
