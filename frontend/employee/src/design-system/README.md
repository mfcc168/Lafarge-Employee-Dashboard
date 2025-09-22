# Lafarge Employee Dashboard Design System

A comprehensive design system built with modern web technologies to ensure consistency, accessibility, and superior user experience across the Lafarge Employee Dashboard.

## 🎨 Overview

This design system provides a complete set of design tokens, components, and guidelines that establish a cohesive visual language and interaction patterns for the dashboard.

### Key Features
- 🎯 **Brand-aligned colors** - Professional Lafarge-inspired palette
- ⚡ **Rich animations** - 25+ micro-interactions and transitions
- 🏗️ **Centralized tokens** - Consistent spacing, typography, and styling
- 📱 **Responsive design** - Mobile-first approach with desktop enhancements
- ♿ **Accessibility focused** - WCAG compliant color contrasts and interactions

---

## 🎨 Colors

### Brand Colors

#### Primary (Brand Blue)
```css
/* Main brand color - professional and trustworthy */
primary-500: #0ea5e9  /* Primary actions, links, focus states */
primary-600: #0284c7  /* Hover states */
primary-700: #0369a1  /* Active states */
```

#### Secondary (Accent Yellow)
```css
/* Accent color for highlights and warnings */
secondary-500: #eab308  /* Highlights, badges */
secondary-600: #ca8a04  /* Hover states */
```

#### Accent (Success Green)
```css
/* Success states and positive actions */
accent-500: #22c55e   /* Success messages, confirmations */
accent-600: #16a34a   /* Hover states */
```

### Semantic Colors

#### Success
- Used for: Successful operations, confirmations, positive feedback
- Colors: `success-50` through `success-900`

#### Warning  
- Used for: Alerts, cautions, important notices
- Colors: `warning-50` through `warning-900`

#### Error
- Used for: Error states, destructive actions, critical alerts
- Colors: `error-50` through `error-900`

#### Info
- Used for: Informational messages, tips, neutral feedback
- Colors: `info-50` through `info-900`

### Usage Examples
```html
<!-- Primary button -->
<button class="bg-primary-500 hover:bg-primary-600 text-white">
  Save Changes
</button>

<!-- Success notification -->
<div class="bg-success-100 border border-success-400 text-success-700">
  Profile updated successfully!
</div>

<!-- Warning badge -->
<span class="bg-warning-100 text-warning-800 px-2 py-1 rounded-full">
  Pending Approval
</span>
```

---

## ✨ Animations

### Fade Animations
Perfect for content transitions and state changes.

```html
<!-- Basic fade in -->
<div class="animate-fadeIn">Content appears smoothly</div>

<!-- Directional fades -->
<div class="animate-fadeInUp">Slides up while fading in</div>
<div class="animate-fadeInDown">Slides down while fading in</div>

<!-- Speed variants -->
<div class="animate-fadeInFast">Quick fade (300ms)</div>
<div class="animate-fadeInSlow">Slow fade (2s)</div>
```

### Scale Animations
Great for modals, dropdowns, and interactive elements.

```html
<!-- Scale in/out -->
<div class="animate-scaleIn">Grows from center</div>
<div class="animate-scaleOut">Shrinks to center</div>

<!-- Speed variants -->
<div class="animate-scaleInFast">Quick scale (150ms)</div>
<div class="animate-scaleInSlow">Slow scale (500ms)</div>
```

### Slide Animations
Ideal for panels, drawers, and navigation transitions.

```html
<!-- Directional slides -->
<div class="animate-slideInRight">Slides from right</div>
<div class="animate-slideInLeft">Slides from left</div>
<div class="animate-slideOutRight">Slides to right</div>
<div class="animate-slideOutLeft">Slides to left</div>
```

### Interactive Animations
For buttons, cards, and hover effects.

```html
<!-- Button interactions -->
<button class="hover:animate-buttonHover">Lifts on hover</button>

<!-- Card interactions -->
<div class="hover:animate-cardHover">Card with lift effect</div>

<!-- Pulse effects -->
<div class="animate-pulse">Loading indicator</div>
<div class="animate-pulseFast">Fast pulse</div>
<div class="animate-pulseScale">Scale pulse</div>
```

### Utility Animations
For feedback, loading states, and special effects.

```html
<!-- Error feedback -->
<div class="animate-shake">Shakes for errors</div>

<!-- Loading spinners -->
<div class="animate-spin">Standard spinner</div>
<div class="animate-spinSlow">Slow spinner</div>
<div class="animate-spinReverse">Reverse spinner</div>

<!-- Special effects -->
<div class="animate-glow">Glowing effect</div>
<div class="animate-bounce">Bouncing element</div>
```

### UI Component Animations
Pre-built animations for common UI patterns.

```html
<!-- Notifications -->
<div class="animate-notificationSlideIn">Notification slides in</div>

<!-- Modals -->
<div class="animate-modalBackdropFadeIn">Modal backdrop</div>
<div class="animate-modalContentSlideIn">Modal content</div>

<!-- Loading states -->
<div class="animate-skeletonPulse">Skeleton loading</div>
<div class="animate-progressFill">Progress bar fill</div>
```

---

## 📝 Typography

### Font Families
```css
/* Primary font - clean and professional */
font-sans: Inter, system-ui, sans-serif

/* Monospace - for code and data */
font-mono: JetBrains Mono, Menlo, Monaco, monospace

/* Display font - for headlines */
font-display: Cal Sans, Inter, system-ui, sans-serif
```

### Font Sizes
From `text-xs` (0.75rem) to `text-9xl` (8rem) with optimal line heights.

### Font Weights
- `font-thin` (100) - Minimal text
- `font-light` (300) - Secondary text
- `font-normal` (400) - Body text
- `font-medium` (500) - Emphasized text
- `font-semibold` (600) - Headings
- `font-bold` (700) - Strong emphasis
- `font-extrabold` (800) - Hero text

---

## 📏 Spacing

Extended spacing scale with additional options:
- Standard scale: `0` to `96` (0px to 24rem)
- Additional: `18` (4.5rem), `88` (22rem), `128` (32rem)

```html
<!-- Consistent spacing -->
<div class="p-6 m-4 space-y-3">
  <div class="mb-8">Large bottom margin</div>
  <div class="px-18">Custom horizontal padding</div>
</div>
```

---

## 🔲 Border Radius

Enhanced border radius options:
- `rounded-none` (0px)
- `rounded-sm` (0.125rem) to `rounded-3xl` (1.5rem)
- `rounded-4xl` (2rem) - Large radius
- `rounded-5xl` (2.5rem) - Extra large radius
- `rounded-full` (9999px) - Circular

---

## 🌟 Shadows

### Standard Shadows
- `shadow-sm` to `shadow-2xl` - Standard elevation
- `shadow-inner` - Inset shadow
- `shadow-none` - No shadow

### Custom Shadows
- `shadow-soft` - Subtle, soft shadow
- `shadow-strong` - Bold, dramatic shadow
- `shadow-glow` - Blue glow effect
- `shadow-glow-lg` - Large blue glow

```html
<!-- Elevation hierarchy -->
<div class="shadow-sm">Card level 1</div>
<div class="shadow-md">Card level 2</div>
<div class="shadow-lg">Card level 3</div>

<!-- Special effects -->
<div class="shadow-glow">Glowing element</div>
<div class="shadow-soft">Soft elevation</div>
```

---

## ⏱️ Timing & Easing

### Duration Scale
- `duration-instant` (0ms) - Immediate
- `duration-fast` (150ms) - Quick interactions
- `duration-normal` (300ms) - Standard transitions
- `duration-slow` (500ms) - Deliberate animations
- `duration-slower` (1000ms) - Dramatic effects

### Easing Functions
- `ease-smooth` - Smooth, natural motion
- `ease-bounce` - Playful bounce effect
- `ease-elastic` - Elastic spring effect
- `ease-sharp` - Immediate start
- `ease-standard` - Material Design standard
- `ease-emphasized` - Material Design emphasized

```html
<!-- Custom transitions -->
<div class="transition-all duration-normal ease-smooth">
  Smooth transition
</div>

<div class="transition-transform duration-fast ease-bounce hover:scale-105">
  Bouncy hover effect
</div>
```

---

## 🎯 Component Guidelines

### Buttons
Use semantic color variants and consistent sizing:

```html
<!-- Primary actions -->
<button class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-fast">
  Primary Button
</button>

<!-- Secondary actions -->
<button class="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-fast">
  Secondary Button
</button>

<!-- Destructive actions -->
<button class="bg-error-500 hover:bg-error-600 text-white px-4 py-2 rounded-lg transition-colors duration-fast">
  Delete Item
</button>
```

### Form Inputs
Consistent styling with proper focus states:

```html
<input 
  type="text" 
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 transition-colors duration-fast"
  placeholder="Enter your text"
>
```

### Cards
Clean, elevated containers:

```html
<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-normal">
  <h3 class="text-lg font-semibold mb-4">Card Title</h3>
  <p class="text-gray-600">Card content goes here.</p>
</div>
```

---

## 📱 Responsive Design

### Breakpoints
- `sm:` 640px+ (Mobile landscape)
- `md:` 768px+ (Tablet)
- `lg:` 1024px+ (Desktop)
- `xl:` 1280px+ (Large desktop)
- `2xl:` 1536px+ (Extra large)

### Mobile-First Examples
```html
<!-- Responsive spacing -->
<div class="p-4 lg:p-8">
  Larger padding on desktop
</div>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  Responsive grid layout
</div>

<!-- Responsive text -->
<h1 class="text-2xl lg:text-4xl font-bold">
  Larger text on desktop
</h1>
```

---

## ♿ Accessibility

### Focus States
All interactive elements include proper focus indicators:

```html
<button class="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Accessible Button
</button>
```

### Color Contrast
All color combinations meet WCAG AA standards:
- Text on white backgrounds: minimum 4.5:1 ratio
- Large text: minimum 3:1 ratio
- Interactive elements: clear visual indicators

### Motion Preferences
Respect user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fadeIn {
    animation: none;
  }
}
```

---

## 🚀 Getting Started

### 1. Import the Design System
```javascript
import designSystem from '@/design-system';
```

### 2. Use in Components
```javascript
// Get colors
const primaryColor = designSystem.getColor('primary.500');

// Get animations
const fadeAnimation = designSystem.getAnimation('fadeIn');

// Get spacing
const spacing = designSystem.getSpacing('6');
```

### 3. Apply Classes
```html
<div class="bg-primary-500 text-white animate-fadeIn p-6 rounded-lg shadow-md">
  Design system in action!
</div>
```

---

## 🔧 Customization

### Extending Colors
Add custom colors to the Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e'
        }
      }
    }
  }
}
```

### Custom Animations
Add new animations to the system:

```javascript
// In design-system/animations.js
export const customAnimations = {
  wiggle: 'wiggle 1s ease-in-out infinite'
};

export const customKeyframes = {
  wiggle: {
    '0%, 100%': { transform: 'rotate(-3deg)' },
    '50%': { transform: 'rotate(3deg)' }
  }
};
```

---

## 📋 Best Practices

### 1. Color Usage
- Use semantic colors for their intended purpose
- Maintain sufficient contrast ratios
- Test in different lighting conditions

### 2. Animation Guidelines
- Use animations purposefully, not decoratively
- Keep durations appropriate for the action
- Provide reduced-motion alternatives

### 3. Spacing Consistency
- Use the spacing scale consistently
- Maintain visual rhythm with consistent spacing
- Group related elements with shared spacing

### 4. Typography Hierarchy
- Establish clear information hierarchy
- Use font weights purposefully
- Maintain comfortable reading experiences

---

## 🔄 Updates & Maintenance

This design system is a living document. When making updates:

1. **Update tokens first** - Change values in the token files
2. **Test thoroughly** - Verify changes across all components
3. **Document changes** - Update this README with new features
4. **Communicate updates** - Inform the development team of changes

---

## 🤝 Contributing

When contributing to the design system:

1. Follow established patterns and conventions
2. Ensure accessibility compliance
3. Test across different devices and browsers
4. Update documentation for any new features
5. Consider backwards compatibility

---

*Built with ❤️ for the Lafarge Employee Dashboard*