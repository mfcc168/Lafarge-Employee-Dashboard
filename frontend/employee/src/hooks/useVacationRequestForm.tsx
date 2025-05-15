import { useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@context/AuthContext';
import { DateItem } from '@interfaces/index';

export const useVacationRequestForm = () => {
  const [dateItems, setDateItems] = useState<DateItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { user, accessToken, refreshUser } = useAuth();

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
      if (item.type === 'half' && item.single_date) {
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
        if (item.type === 'half') return !!item.single_date;
        if (item.type === 'full') return !!item.from_date && !!item.to_date;
        return false;
      })
    ) {
      alert('Please fill in all vacation dates before submitting.');
      return false;
    }

    if (
      user?.annual_leave_days != null &&
      getTotalVacationDay > user.annual_leave_days
    ) {
      alert(
        `You only have ${user.annual_leave_days} days left, but requested ${getTotalVacationDay}.`
      );
      return false;
    }

    setSubmitting(true);
    try {
      await axios.post(
        'http://127.0.0.1:8000/api/vacation/create',
        { date_items: dateItems },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      await refreshUser();
      setDateItems([]);
      return true;
    } catch (err) {
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
    user,
  };
}