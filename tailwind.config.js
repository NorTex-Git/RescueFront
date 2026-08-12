/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./templates/**/*.html",
    "./static/js/**/*.js",
    "./static/css/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        'rescue-red': '#ef4444',
        'rescue-blue': '#3b82f6',
        'rescue-cyan': '#22d3ee',
        'rescue-gray': '#6b7280',
        'rescue-slate': '#020617'
      },
      fontFamily: {
        'rescue': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
}
