/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',

  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
      mono: ['JetBrains Mono']
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
        'f-success': '#30dbde',
        red: {
          DEFAULT: '#AF3029',
          light: '#D14D41'
        },
        orange: {
          DEFAULT: '#BC5215',
          light: '#DA702C'
        },
        yellow: {
          DEFAULT: '#AD8301',
          light: '#D0A215'
        },
        green: {
          DEFAULT: '#66800B',
          light: '#879A39'
        },
        cyan: {
          DEFAULT: '#24837B',
          light: '#3AA99F'
        },
        blue: {
          DEFAULT: '#205EA6',
          light: '#4385BE'
        },
        purple: {
          DEFAULT: '#5E409D',
          light: '#8B7EC8'
        },
        magenta: {
          DEFAULT: '#A02F6F',
          light: '#CE5D97'
        }
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
