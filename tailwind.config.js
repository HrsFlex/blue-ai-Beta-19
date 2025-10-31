/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"], // Make sure JSX files are included
  theme: {
    extend: {},
  },
  plugins: [],
  mode: 'jit', // Add this line to enable JIT mode
};
