export interface MonthNavigatorProps {
    year: number;
    month: number;
    canGoPrevious: boolean;
    canGoNext: boolean;
    onNavigate: (direction: -1 | 1) => void;
  };