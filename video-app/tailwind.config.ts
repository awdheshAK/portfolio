import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f0ff',
          100: '#e6e1ff',
          200: '#cdc3ff',
          300: '#ac97ff',
          400: '#8a63ff',
          500: '#7238ff',
          600: '#631cf0',
          700: '#5314c9',
          800: '#4512a1',
          900: '#3a1180',
          950: '#230a55',
        },
        surface: {
          DEFAULT: '#0b0b12',
          50: '#f7f7fb',
          100: '#eeeef4',
          200: '#d6d6e4',
          800: '#16161f',
          900: '#0f0f16',
          950: '#08080d',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite linear',
        'fade-in': 'fade-in .2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
