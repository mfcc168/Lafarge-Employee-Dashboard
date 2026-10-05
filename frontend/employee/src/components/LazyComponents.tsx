import { lazy, Suspense, ComponentType, ReactElement } from "react";
import LoadingSpinner from "./LoadingSpinner";
import SkeletonRow from "./SkeletonRow";
import ChunkLoadErrorBoundary from "./ChunkLoadErrorBoundary";
import { retryChunkImport } from "@utils/retryLazyImport";

/**
 * Higher-order component for lazy loading with chunk error handling and retry logic
 */
const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactElement = <LoadingSpinner />,
) => {
  const LazyComponent = lazy(retryChunkImport(importFunc));

  return (props: P) => (
    <ChunkLoadErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ChunkLoadErrorBoundary>
  );
};

/**
 * Skeleton fallback for table-like components
 */
const TableSkeleton = () => (
  <div role="status" aria-label="Loading data" className="surface surface-pad">
    <table>
      <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </tbody>
    </table>
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
  () => import("./ReportEntryForm"),
  <div className="p-8">
    <LoadingSpinner />
  </div>,
);

export const LazyAllEmployeePayroll = withLazyLoading(
  () => import("./AllEmployeePayroll"),
  <TableSkeleton />,
);

export const LazySalesmanMonthlyReport = withLazyLoading(
  () => import("./SalesmanMonthlyReport"),
  <CardSkeleton />,
);

export const LazyVacationRequestForm = withLazyLoading(
  () => import("./VacationRequestForm"),
  <div className="people-panel">
    <LoadingSpinner message="Loading vacation form…" />
  </div>,
);

export const LazyReportEntryList = withLazyLoading(
  () => import("./ReportEntryList"),
  <div className="surface p-8">
    <LoadingSpinner message="Loading daily reports…" />
  </div>,
);

export const LazyWeeklySamplesSummary = withLazyLoading(
  () => import("./WeeklySamplesSummary"),
  <LoadingSpinner message="Loading weekly samples…" />,
);

export const LazyWeeklyNewClientOrder = withLazyLoading(
  () => import("./WeeklyNewClientOrder"),
  <LoadingSpinner message="Loading new client orders…" />,
);

export const LazyEmployeeManagement = withLazyLoading(
  () => import("./EmployeeManagement"),
  <TableSkeleton />,
);
