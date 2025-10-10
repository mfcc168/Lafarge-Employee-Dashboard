import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { useToast } from '@context/ToastContext';
import { DateItem } from '@interfaces/index';
import { backendUrl } from '@configs/DotEnv';

export const useVacationRequestForm = () => {
  const queryClient = useQueryClient();
  const [dateItems, setDateItems] = useState<DateItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
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

  const getTotalVacationDay = useMemo(() => {
    return dateItems.reduce((total, item) => {
      if (item.leave_type === 'Sick Leave') {
        return total;
      }
      if (item.type === 'half' && item.single_date && item.half_day_period) {
        return total + 0.5;
      } else if (item.type === 'full' && item.from_date && item.to_date) {
        const from = new Date(item.from_date);
        const to = new Date(item.to_date);
        const diffTime = to.getTime() - from.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + (diffDays > 0 ? diffDays : 0);
      }
      return total;
    }, 0);
  }, [dateItems]);

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
    signatureData,
    setSignatureData,
    clearSignature: () => setSignatureData(''),
    user,
  };
}
