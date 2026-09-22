import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { DateItem } from '@interfaces/index';
import { backendUrl } from '@configs/DotEnv';
import { calculateBusinessDays, getExcludedDatesInRange, ExcludedDate } from '@utils/businessDays';

export const useVacationRequestForm = () => {
  const queryClient = useQueryClient();
  const [dateItems, setDateItems] = useState<DateItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [totalVacationDays, setTotalVacationDays] = useState(0);
  const [excludedDates, setExcludedDates] = useState<ExcludedDate[]>([]);
  const { user, accessToken, refreshUser } = useAuth();
  const { showWarning, showError, showSuccess } = useToast();

  const addItem = () => {
    setDateItems([...dateItems, { type: 'full', from_date: '', to_date: '' }]);
  };

  const updateItem = (index: number, updated: DateItem) => {
    const items = [...dateItems];
    items[index] = updated;
    setDateItems(items);
  };

  const removeItem = (index: number) => {
    setDateItems(dateItems.filter((_, i) => i !== index));
  };

  // Calculate vacation days asynchronously using business days
  useEffect(() => {
    const calculateTotalDays = async () => {
      let total = 0;
      let allExcludedDates: ExcludedDate[] = [];
      
      for (const item of dateItems) {
        if (item.leave_type === 'Sick Leave') {
          continue;
        }
        
        if (item.type === 'half' && item.single_date && item.half_day_period) {
          // For half days, check if it's a business day
          const businessDays = await calculateBusinessDays(item.single_date, item.single_date);
          total += businessDays > 0 ? 0.5 : 0;
          
          // Get excluded dates for half day
          const excluded = await getExcludedDatesInRange(item.single_date, item.single_date);
          allExcludedDates.push(...excluded);
        } else if (item.type === 'full' && item.from_date && item.to_date) {
          const businessDays = await calculateBusinessDays(item.from_date, item.to_date);
          total += businessDays;
          
          // Get excluded dates for date range
          const excluded = await getExcludedDatesInRange(item.from_date, item.to_date);
          allExcludedDates.push(...excluded);
        }
      }
      
      // Remove duplicates based on date
      const uniqueExcludedDates = allExcludedDates.filter((date, index, self) => 
        index === self.findIndex(d => d.date === date.date)
      );
      
      setTotalVacationDays(total);
      setExcludedDates(uniqueExcludedDates);
    };
    
    if (dateItems.length > 0) {
      calculateTotalDays();
    } else {
      setTotalVacationDays(0);
      setExcludedDates([]);
    }
  }, [dateItems]);

  const getTotalVacationDay = totalVacationDays;

  const getVacationDayLeft = useMemo(() => {
    if (user?.annual_leave_days != null) {
      return user.annual_leave_days - getTotalVacationDay;
    }
    return undefined;
  }, [user?.annual_leave_days, getTotalVacationDay]);

  const handleSubmit = async () => {
    if (
      dateItems.length === 0 ||
      !dateItems.every((item) => {
        if (item.type === 'half') return !!item.single_date && !!item.half_day_period;
        if (item.type === 'full') return !!item.from_date && !!item.to_date;
        return false;
      })
    ) {
      showWarning(
        'Missing Vacation Dates',
        'Please complete all vacation date details before submitting.'
      );
      return false;
    }

    if (!signatureData) {
      showWarning(
        'Signature Required',
        'Please provide your signature before submitting your request.'
      );
      return false;
    }

    if (
      user?.annual_leave_days != null &&
      getTotalVacationDay > user.annual_leave_days
    ) {
      showError(
        'Vacation Limit Exceeded',
        `You only have ${user.annual_leave_days} days left, but requested ${getTotalVacationDay}.`
      );
      return false;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${backendUrl}/api/vacation/create`,
        { date_items: dateItems, signature_data: signatureData },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      await queryClient.invalidateQueries({
        queryKey: ['vacationRequests']
      });
      if (user?.username) {
        await queryClient.invalidateQueries({
          queryKey: ['vacationRequests', user.username]
        });
      }
      await refreshUser();
      setDateItems([]);
      setSignatureData('');
      showSuccess(
        'Request Submitted',
        'Your vacation request has been sent for approval.'
      );
      return true;
    } catch {
      showError(
        'Submission Failed',
        'We could not submit your vacation request. Please try again.'
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    dateItems,
    submitting,
    addItem,
    updateItem,
    removeItem,
    handleSubmit,
    getTotalVacationDay,
    getVacationDayLeft,
    excludedDates,
    signatureData,
    setSignatureData,
    clearSignature: () => setSignatureData(''),
    user,
  };
}
