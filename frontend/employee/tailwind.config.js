/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Brand Colors - Lafarge Professional Palette
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9', 
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // Modern slate
          600: '#475569',
          700: '#334155', // Main primary
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        
        secondary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Fresh emerald
          600: '#059669', // Main secondary
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },

        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Success green (kept same)
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },

        // Semantic Colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      },

      // Enhanced Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif']
      },

      // Enhanced Animations
      animation: {
        // Existing
        fadeIn: "fadeIn 1s ease-in-out",
        
        // New fade animations
        fadeOut: 'fadeOut 0.3s ease-in-out',
        fadeInUp: 'fadeInUp 0.5s ease-out',
        fadeInDown: 'fadeInDown 0.5s ease-out',
        fadeInFast: 'fadeIn 0.3s ease-in-out',
        fadeInSlow: 'fadeIn 2s ease-in-out',
        
        // Scale animations
        scaleIn: 'scaleIn 0.3s ease-out',
        scaleOut: 'scaleOut 0.3s ease-in',
        scaleInFast: 'scaleIn 0.15s ease-out',
        scaleInSlow: 'scaleIn 0.5s ease-out',
        
        // Slide animations
        slideInRight: 'slideInRight 0.3s ease-out',
        slideInLeft: 'slideInLeft 0.3s ease-out',
        slideOutRight: 'slideOutRight 0.3s ease-in',
        slideOutLeft: 'slideOutLeft 0.3s ease-in',
        
        // Bounce animations
        bounceIn: 'bounceIn 0.6s ease-out',
        bounceOnce: 'bounce 0.6s ease-out',
        
        // Pulse animations
        pulseFast: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        pulseSlow: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        pulseScale: 'pulseScale 2s ease-in-out infinite',
        
        // Utility animations
        shake: 'shake 0.5s ease-in-out',
        spinSlow: 'spinSlow 2s linear infinite',
        spinReverse: 'spinReverse 1s linear infinite',
        
        // Interactive animations
        glow: 'glow 2s ease-in-out infinite',
        progressFill: 'progressFill 1s ease-out',
        
        // UI component animations
        notificationSlideIn: 'notificationSlideIn 0.3s ease-out',
        modalBackdropFadeIn: 'modalBackdropFadeIn 0.3s ease-out',
        modalContentSlideIn: 'modalContentSlideIn 0.3s ease-out',
        skeletonPulse: 'skeletonPulse 1.5s ease-in-out infinite',
        
        // Hover animations
        buttonHover: 'buttonHover 0.2s ease-out',
        cardHover: 'cardHover 0.3s ease-out'
      },

      keyframes: {
        // Existing
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        
        // New keyframes
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        
        fadeInUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        
        fadeInDown: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        
        scaleIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.9)'
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)'
          }
        },
        
        scaleOut: {
          '0%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
          '100%': { 
            opacity: '0',
            transform: 'scale(0.9)'
          }
        },
        
        slideInRight: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(100%)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        
        slideInLeft: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(-100%)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0)'
          }
        },
        
        slideOutRight: {
          '0%': { 
            opacity: '1',
            transform: 'translateX(0)'
          },
          '100%': { 
            opacity: '0',
            transform: 'translateX(100%)'
          }
        },
        
        slideOutLeft: {
          '0%': { 
            opacity: '1',
            transform: 'translateX(0)'
          },
          '100%': { 
            opacity: '0',
            transform: 'translateX(-100%)'
          }
        },
        
        bounceIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)'
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)'
          },
          '70%': {
            transform: 'scale(0.9)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)'
          }
        },
        
        pulseScale: {
          '0%, 100%': {
            transform: 'scale(1)'
          },
          '50%': {
            transform: 'scale(1.05)'
          }
        },
        
        shake: {
          '0%, 100%': {
            transform: 'translateX(0)'
          },
          '10%, 30%, 50%, 70%, 90%': {
            transform: 'translateX(-10px)'
          },
          '20%, 40%, 60%, 80%': {
            transform: 'translateX(10px)'
          }
        },
        
        spinSlow: {
          '0%': {
            transform: 'rotate(0deg)'
          },
          '100%': {
            transform: 'rotate(360deg)'
          }
        },
        
        spinReverse: {
          '0%': {
            transform: 'rotate(0deg)'
          },
          '100%': {
            transform: 'rotate(-360deg)'
          }
        },
        
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)'
          },
          '50%': {
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
          }
        },
        
        progressFill: {
          '0%': {
            width: '0%'
          },
          '100%': {
            width: '100%'
          }
        },
        
        notificationSlideIn: {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        
        modalBackdropFadeIn: {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        },
        
        modalContentSlideIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-50px) scale(0.95)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)'
          }
        },
        
        skeletonPulse: {
          '0%': {
            backgroundColor: 'rgb(229, 231, 235)'
          },
          '50%': {
            backgroundColor: 'rgb(209, 213, 219)'
          },
          '100%': {
            backgroundColor: 'rgb(229, 231, 235)'
          }
        },
        
        buttonHover: {
          '0%': {
            transform: 'translateY(0)'
          },
          '100%': {
            transform: 'translateY(-2px)'
          }
        },
        
        cardHover: {
          '0%': {
            transform: 'translateY(0)',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          },
          '100%': {
            transform: 'translateY(-4px)',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }
        }
      },

      // Enhanced Timing Functions
      transitionTimingFunction: {
        'ease-smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ease-sharp': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-acceleration': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-deceleration': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-emphasized': 'cubic-bezier(0.4, 0, 0.6, 1)'
      },

      // Duration Scale
      transitionDuration: {
        'instant': '0ms',
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
        'slower': '1000ms'
      },

      // Enhanced Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },

      // Enhanced Border Radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      },

      // Enhanced Box Shadow
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.08)',
        'strong': '0 10px 40px 0 rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)'
      }
    },
  },
  plugins: [
    // Add any additional plugins here
  ],
}
