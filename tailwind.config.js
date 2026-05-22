/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#AB1010',
        lightGrey: "#CDCDCD",
      },
      fontFamily: {
        icon: 'Material Symbols Rounded',
      }
    },
  },
  plugins: [],
};
