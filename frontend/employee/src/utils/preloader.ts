/**
 * Intelligent preloading utilities for better performance
 * Preloads routes based on user role and navigation patterns
 */

import { useAuth } from '@context/AuthContext';
import { useEffect } from 'react';

// Route preloading functions
const preloadRoute = (routeImport: () => Promise<any>) => {
  // Only preload if we have sufficient bandwidth and the user isn't on a slow connection
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      return; // Skip preloading on slow connections
    }
  }
  
  // Preload after a short delay to avoid blocking initial render
  setTimeout(() => {
    routeImport().catch(() => {
      // Silently handle preload failures
      console.log('Preload failed for route');
    });
  }, 100);
};

/**
 * Role-based preloading hook
 * Preloads likely routes based on user role
 */
export const useRoleBasedPreloading = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Preload common routes for all authenticated users
    preloadRoute(() => import('@pages/Vacation'));
    preloadRoute(() => import('@pages/Home'));

    // Role-specific preloading
    switch (user.role) {
      case 'SALESMAN':
        // Salesmen likely use Report and Sales features heavily
        preloadRoute(() => import('@pages/Report'));
        preloadRoute(() => import('@pages/Sales'));
        preloadRoute(() => import('@pages/Client'));
        break;
        
      case 'ADMIN':
      case 'DIRECTOR':
      case 'CEO':
        // Management roles need payroll and all employee data
        preloadRoute(() => import('@pages/Payroll'));
        preloadRoute(() => import('@pages/Sales'));
        preloadRoute(() => import('@pages/Client'));
        break;
        
      case 'MANAGER':
        // Managers need vacation approvals and some reports
        preloadRoute(() => import('@pages/Sales'));
        preloadRoute(() => import('@pages/Client'));
        break;
    }
  }, [user?.role, isAuthenticated]);
};

/**
 * Hover-based preloading for navigation items
 * Preloads route when user hovers over nav link
 */
export const useHoverPreload = () => {
  const preloadMap: Record<string, () => Promise<any>> = {
    '/': () => import('@pages/Home'),
    '/report': () => import('@pages/Report'),
    '/payroll': () => import('@pages/Payroll'),
    '/vacation': () => import('@pages/Vacation'),
    '/sales': () => import('@pages/Sales'),
    '/client': () => import('@pages/Client'),
  };

  const handleMouseEnter = (path: string) => {
    const preloadFunc = preloadMap[path];
    if (preloadFunc) {
      preloadRoute(preloadFunc);
    }
  };

  return { handleMouseEnter };
};

/**
 * Intersection Observer based preloading
 * Preloads components when they're about to come into view
 */
export const useIntersectionPreload = (
  componentImport: () => Promise<any>,
  threshold: number = 0.1
) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadRoute(componentImport);
            observer.disconnect(); // Only preload once
          }
        });
      },
      { threshold }
    );

    // Create a dummy element to observe (can be customized)
    const triggerElement = document.createElement('div');
    triggerElement.style.position = 'absolute';
    triggerElement.style.top = '80vh'; // Trigger when 80% scrolled
    triggerElement.style.height = '1px';
    triggerElement.style.width = '1px';
    triggerElement.style.pointerEvents = 'none';
    
    document.body.appendChild(triggerElement);
    observer.observe(triggerElement);

    return () => {
      observer.disconnect();
      document.body.removeChild(triggerElement);
    };
  }, [componentImport, threshold]);
};