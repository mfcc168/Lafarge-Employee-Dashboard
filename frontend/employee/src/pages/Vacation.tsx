import { useVacationRequestForm } from '@hooks/useVacationRequestForm';
import VacationRequestForm from '@components/VacationRequestForm';
import MyVacationRequestList from '@components/MyVacationRequestList';
import { useAuth } from '@context/AuthContext';
import VacationRequestList from '@components/VacationRequestList';

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

  const { user } = useAuth(); 

  return (
    <>
    {(user?.role === "MANAGER" || user?.role === "ADMIN"|| user?.role === "CEO" || user?.role === "DIRECTOR") && (
        <VacationRequestList />
    )}
    {(user?.role === "CLERK" || user?.role === "DELIVERYMAN"|| user?.role === "SALESMAN") && (
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
    )}
    </>
  );
}

export default Vacation;