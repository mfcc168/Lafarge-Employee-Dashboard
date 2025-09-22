/**
 * Animation Library for Lafarge Employee Dashboard
 * Comprehensive collection of animations and micro-interactions
 */

// Keyframes for custom animations
export const keyframes = {
  // Existing fadeIn
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' }
  },
  
  // Fade animations
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
  
  // Scale animations
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
  
  // Slide animations
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
  
  // Bounce animations
  bounce: {
    '0%, 20%, 53%, 80%, 100%': {
      transform: 'translate3d(0,0,0)'
    },
    '40%, 43%': {
      transform: 'translate3d(0, -30px, 0)'
    },
    '70%': {
      transform: 'translate3d(0, -15px, 0)'
    },
    '90%': {
      transform: 'translate3d(0, -4px, 0)'
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
  
  // Pulse animations
  pulse: {
    '0%, 100%': {
      opacity: '1'
    },
    '50%': {
      opacity: '0.5'
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
  
  // Shake animation for errors
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
  
  // Spin variations
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
  
  // Glow animation for focus states
  glow: {
    '0%, 100%': {
      boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)'
    },
    '50%': {
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
    }
  },
  
  // Progress animations
  progressFill: {
    '0%': {
      width: '0%'
    },
    '100%': {
      width: '100%'
    }
  },
  
  // Notification animations
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
  
  // Modal animations
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
  
  // Loading animations
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
  
  // Hover effects
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
};

// Animation definitions with timing
export const animations = {
  // Existing fadeIn
  'fadeIn': 'fadeIn 1s ease-in-out',
  
  // Fade animations
  'fadeOut': 'fadeOut 0.3s ease-in-out',
  'fadeInUp': 'fadeInUp 0.5s ease-out',
  'fadeInDown': 'fadeInDown 0.5s ease-out',
  'fadeInFast': 'fadeIn 0.3s ease-in-out',
  'fadeInSlow': 'fadeIn 2s ease-in-out',
  
  // Scale animations
  'scaleIn': 'scaleIn 0.3s ease-out',
  'scaleOut': 'scaleOut 0.3s ease-in',
  'scaleInFast': 'scaleIn 0.15s ease-out',
  'scaleInSlow': 'scaleIn 0.5s ease-out',
  
  // Slide animations
  'slideInRight': 'slideInRight 0.3s ease-out',
  'slideInLeft': 'slideInLeft 0.3s ease-out',
  'slideOutRight': 'slideOutRight 0.3s ease-in',
  'slideOutLeft': 'slideOutLeft 0.3s ease-in',
  
  // Bounce animations
  'bounce': 'bounce 1s infinite',
  'bounceIn': 'bounceIn 0.6s ease-out',
  'bounceOnce': 'bounce 0.6s ease-out',
  
  // Pulse animations
  'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'pulseFast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'pulseSlow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'pulseScale': 'pulseScale 2s ease-in-out infinite',
  
  // Utility animations
  'shake': 'shake 0.5s ease-in-out',
  'spin': 'spin 1s linear infinite',
  'spinSlow': 'spinSlow 2s linear infinite',
  'spinReverse': 'spinReverse 1s linear infinite',
  'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  
  // Interactive animations
  'glow': 'glow 2s ease-in-out infinite',
  'progressFill': 'progressFill 1s ease-out',
  
  // UI component animations
  'notificationSlideIn': 'notificationSlideIn 0.3s ease-out',
  'modalBackdropFadeIn': 'modalBackdropFadeIn 0.3s ease-out',
  'modalContentSlideIn': 'modalContentSlideIn 0.3s ease-out',
  'skeletonPulse': 'skeletonPulse 1.5s ease-in-out infinite',
  
  // Hover animations (for use with hover: prefix)
  'buttonHover': 'buttonHover 0.2s ease-out',
  'cardHover': 'cardHover 0.3s ease-out'
};

// Animation timing functions
export const timingFunctions = {
  'ease-smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  'ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'ease-elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'ease-sharp': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-acceleration': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-deceleration': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'ease-emphasized': 'cubic-bezier(0.4, 0, 0.6, 1)'
};

// Duration scale
export const durations = {
  'instant': '0ms',
  'fast': '150ms',
  'normal': '300ms',
  'slow': '500ms',
  'slower': '1000ms'
};

export default {
  keyframes,
  animations,
  timingFunctions,
  durations
};