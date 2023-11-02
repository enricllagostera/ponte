/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',

  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      serif: ['Merriweather', 'serif']
    },
    extend: {
      colors: {
        app: '#13d44e',
        'app-accessible': '#10a73e',
        'c-black': '#101010',
        'c-white': '#fafafa',
        'f-grey': {
          100: '#a0a0a0',
          200: '#555555'
        },
        'f-info': '#668ee3',
        'f-warn': '#ffb300',
        'f-danger': '#d73306',
        'f-success': '#30dbde'
      }
    }
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar')({ nocompatible: true })
  ]
}

module.exports = config
