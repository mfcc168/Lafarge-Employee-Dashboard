/**
 * Design System Entry Point
 * Centralized export for all design system components and tokens
 */

import { designTokens, componentTokens } from './tokens.js';
import { keyframes, animations, timingFunctions, durations } from './animations.js';

// Core design system exports
export {
  designTokens,
  componentTokens,
  keyframes,
  animations,
  timingFunctions,
  durations
};

// Utility functions for design system
export const getColor = (path) => {
  const keys = path.split('.');
  let value = designTokens.colors;
  
  for (const key of keys) {
    if (value && value[key] !== undefined) {
      value = value[key];
    } else {
      console.warn(`Color path "${path}" not found in design tokens`);
      return null;
    }
  }
  
  return value;
};

export const getSpacing = (size) => {
  return designTokens.spacing[size] || size;
};

export const getAnimation = (name) => {
  return animations[name] || name;
};

// Design system configuration for Tailwind
export const tailwindConfig = {
  colors: designTokens.colors,
  spacing: designTokens.spacing,
  fontSize: designTokens.typography.fontSize,
  fontFamily: designTokens.typography.fontFamily,
  fontWeight: designTokens.typography.fontWeight,
  borderRadius: designTokens.borderRadius,
  boxShadow: designTokens.boxShadow,
  keyframes,
  animation: animations,
  transitionTimingFunction: timingFunctions,
  transitionDuration: durations
};

// Component variants system
export const variants = {
  button: {
    base: "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    
    variants: {
      variant: {
        primary: "bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500",
        secondary: "bg-secondary-500 hover:bg-secondary-600 text-white focus:ring-secondary-500",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500",
        ghost: "text-gray-700 hover:bg-gray-100 focus:ring-primary-500",
        success: "bg-success-500 hover:bg-success-600 text-white focus:ring-success-500",
        warning: "bg-warning-500 hover:bg-warning-600 text-white focus:ring-warning-500",
        error: "bg-error-500 hover:bg-error-600 text-white focus:ring-error-500"
      },
      
      size: {
        sm: "px-3 py-1.5 text-sm rounded-md",
        md: "px-4 py-2 text-base rounded-lg",
        lg: "px-6 py-3 text-lg rounded-lg"
      }
    },
    
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  },
  
  input: {
    base: "block w-full border border-gray-300 rounded-lg shadow-sm transition-colors duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 placeholder-gray-400",
    
    variants: {
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-4 py-3 text-lg"
      },
      
      state: {
        default: "border-gray-300",
        error: "border-error-500 focus:border-error-500 focus:ring-error-500",
        success: "border-success-500 focus:border-success-500 focus:ring-success-500"
      }
    },
    
    defaultVariants: {
      size: "md",
      state: "default"
    }
  },
  
  card: {
    base: "bg-white rounded-lg shadow transition-shadow duration-200",
    
    variants: {
      padding: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8"
      },
      
      elevation: {
        flat: "shadow-none border border-gray-200",
        low: "shadow-sm",
        medium: "shadow-md",
        high: "shadow-lg",
        highest: "shadow-xl"
      },
      
      interactive: {
        true: "hover:shadow-lg cursor-pointer transition-all duration-300",
        false: ""
      }
    },
    
    defaultVariants: {
      padding: "md",
      elevation: "low",
      interactive: false
    }
  },
  
  badge: {
    base: "inline-flex items-center font-medium rounded-full",
    
    variants: {
      variant: {
        primary: "bg-primary-100 text-primary-800",
        secondary: "bg-secondary-100 text-secondary-800",
        success: "bg-success-100 text-success-800",
        warning: "bg-warning-100 text-warning-800",
        error: "bg-error-100 text-error-800",
        gray: "bg-gray-100 text-gray-800"
      },
      
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base"
      }
    },
    
    defaultVariants: {
      variant: "gray",
      size: "md"
    }
  }
};

// Animation helpers
export const animationHelpers = {
  // Create staggered animation delays for lists
  staggerDelay: (index, baseDelay = 100) => ({
    animationDelay: `${index * baseDelay}ms`
  }),
  
  // Create hover effects
  hoverScale: (scale = 1.05) => ({
    transition: 'transform 200ms ease-out',
    ':hover': {
      transform: `scale(${scale})`
    }
  }),
  
  // Create focus ring
  focusRing: (color = 'primary-500') => ({
    ':focus': {
      outline: 'none',
      ringWidth: '2px',
      ringColor: `var(--color-${color})`,
      ringOpacity: '0.5'
    }
  })
};

// Default export contains everything
export default {
  designTokens,
  componentTokens,
  keyframes,
  animations,
  timingFunctions,
  durations,
  tailwindConfig,
  variants,
  animationHelpers,
  getColor,
  getSpacing,
  getAnimation
};