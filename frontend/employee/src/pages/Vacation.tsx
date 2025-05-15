import { useVacationRequestForm } from '@hooks/useVacationRequestForm';
import VacationRequestForm from '@components/VacationRequestForm';

const Vacation = () => {
  const {
    dateItems,
    submitting,
    addItem,
    updateItem,
    removeItem,
    handleSubmit,
    getTotalVacationDay,
    getVacationDayLeft,
  } = useVacationRequestForm();

  const onSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      alert('Request submitted!');
    } else {
      alert('Submission failed');
    }
  };

  return (
    <VacationRequestForm
      dateItems={dateItems}
      submitting={submitting}
      getTotalVacationDay={getTotalVacationDay}
      getVacationDayLeft={getVacationDayLeft}
      addItem={addItem}
      updateItem={updateItem}
      removeItem={removeItem}
      handleSubmit={onSubmit}
    />
  );
}

export default Vacation;