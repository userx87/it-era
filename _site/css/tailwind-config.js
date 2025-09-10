// IT-ERA Modern Design System - Tailwind Configuration
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // IT-ERA Brand Colors - Modern Palette
        'brand': {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b8ddff',
          300: '#7cc4ff',
          400: '#36a7ff',
          500: '#0088ff',
          600: '#0056cc', // Primary brand color
          700: '#0043a3',
          800: '#003785',
          900: '#002b6b',
          950: '#001a42',
        },
        'neutral': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        'success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'warning': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        'danger': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'display': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'it': '0 4px 6px -1px rgba(0, 86, 204, 0.1), 0 2px 4px -1px rgba(0, 86, 204, 0.06)',
        'it-lg': '0 10px 15px -3px rgba(0, 86, 204, 0.1), 0 4px 6px -2px rgba(0, 86, 204, 0.05)',
        'it-xl': '0 20px 25px -5px rgba(0, 86, 204, 0.1), 0 10px 10px -5px rgba(0, 86, 204, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    }
  },
  plugins: [
    // Plugin per forms
    function({ addUtilities }) {
      const newUtilities = {
        '.btn-it-primary': {
          '@apply bg-it-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-it-blue-700 focus:ring-4 focus:ring-it-blue-200 transition-all duration-200': {},
        },
        '.btn-it-secondary': {
          '@apply bg-white text-it-blue-600 border-2 border-it-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-it-blue-600 hover:text-white focus:ring-4 focus:ring-it-blue-200 transition-all duration-200': {},
        },
        '.btn-it-outline': {
          '@apply border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-it-blue-600 focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-200': {},
        },
        '.card-it': {
          '@apply bg-white rounded-xl shadow-it p-6 hover:shadow-it-lg transition-all duration-300': {},
        },
        '.input-it': {
          '@apply w-full px-4 py-3 border border-it-gray-300 rounded-lg focus:ring-2 focus:ring-it-blue-500 focus:border-it-blue-500 transition-colors duration-200': {},
        },
        '.nav-link-it': {
          '@apply text-it-gray-700 hover:text-it-blue-600 font-medium transition-colors duration-200': {},
        }
      }
      addUtilities(newUtilities)
    }
  ]
}
