/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enforce dark mode class
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FFF5F5',
          100: '#FFEBEB',
          200: '#FFD1D3',
          300: '#FFA8AB',
          400: '#FF7F84',
          500: '#FFA19E',
          600: '#FF8884',
          700: '#E6726E',
        },
        softBlue: {
          50: '#F0F9FF',
          100: '#E4F4FD',
          200: '#D4F0FC',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#2DAAE1',
        },
        softGreen: {
          50: '#F0FDF4',
          100: '#E8F9EE',
          200: '#D2F5DC',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#3CD070',
        },
        softOrange: {
          50: '#FFFDF9',
          100: '#FFF0EC',
          200: '#FEE2DB',
        },
        canvas: '#FFEBE7',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
