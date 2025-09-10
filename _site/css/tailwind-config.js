// Configurazione Tailwind CSS personalizzata per IT-ERA
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Brand Colors IT-ERA
        'it-blue': {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0056cc', // Primary brand color
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'it-gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        'it-green': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        'it-red': {
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
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
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
