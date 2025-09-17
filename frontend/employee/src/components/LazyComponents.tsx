import { lazy, Suspense, ComponentType, ReactElement } from 'react';
import LoadingSpinner from './LoadingSpinner';
import SkeletonRow from './SkeletonRow';

/**
 * Higher-order component for lazy loading with custom fallback
 */
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactElement = <LoadingSpinner />
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Skeleton fallback for table-like components
 */
const TableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);

/**
 * Card skeleton for dashboard widgets
 */
const CardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg shadow animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  </div>
);

// Heavy components that benefit from lazy loading
export const LazyReportEntryForm = withLazyLoading(
  () => import('./ReportEntryForm'),
  <div className="p-8"><LoadingSpinner /></div>
);

export const LazyAllEmployeePayroll = withLazyLoading(
  () => import('./AllEmployeePayroll'),
  <TableSkeleton />
);

export const LazySalesmanMonthlyReport = withLazyLoading(
  () => import('./SalesmanMonthlyReport'),
  <CardSkeleton />
);

export const LazyVacationRequestForm = withLazyLoading(
  () => import('./VacationRequestForm'),
  <div className="max-w-4xl mx-auto px-6 py-8 bg-white rounded-3xl shadow-2xl mt-12">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="space-y-4">
        <div className="h-16 bg-gray-100 rounded"></div>
        <div className="h-16 bg-gray-100 rounded"></div>
      </div>
    </div>
  </div>
);

export const LazyReportEntryList = withLazyLoading(
  () => import('./ReportEntryList'),
  <TableSkeleton />
);

export const LazyWeeklySamplesSummary = withLazyLoading(
  () => import('./WeeklySamplesSummary'),
  <CardSkeleton />
);

export const LazyWeeklyNewClientOrder = withLazyLoading(
  () => import('./WeeklyNewClientOrder'),
  <CardSkeleton />
);