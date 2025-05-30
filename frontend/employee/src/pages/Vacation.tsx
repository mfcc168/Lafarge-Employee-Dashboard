import { useVacationRequestForm } from '@hooks/useVacationRequestForm';
import VacationRequestForm from '@components/VacationRequestForm';
import MyVacationRequestList from '@components/MyVacationRequestList';

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
    <>
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
    <MyVacationRequestList />
    </>
  );
}

export default Vacation;