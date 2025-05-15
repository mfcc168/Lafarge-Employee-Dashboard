import { useState, useMemo } from "react";

export const useMonthlyNavigator = (limitMonth: Date) => {
  const now = new Date();

  const [currentDate, setCurrentDate] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const currentSelectedDate = useMemo(
    () => new Date(currentDate.year, currentDate.month - 1),
    [currentDate]
  );

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentDate((prev) => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { year: newYear, month: newMonth };
    });
  };

  const canGoPrevious = currentSelectedDate > limitMonth;
  const canGoNext =
    currentSelectedDate < new Date(now.getFullYear(), now.getMonth());

  return {
    currentDate,
    currentSelectedDate,
    navigateMonth,
    canGoPrevious,
    canGoNext,
  };
}
