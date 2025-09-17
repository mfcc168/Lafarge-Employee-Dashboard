import { LazyVacationRequestForm as VacationRequestForm } from '@components/LazyComponents';
import MyVacationRequestList from '@components/MyVacationRequestList';
import { useAuth } from '@context/AuthContext';
import VacationRequestList from '@components/VacationRequestList';

const Vacation = () => {

  const { user } = useAuth(); 

  return (
    <>
    {(user?.role === "MANAGER" || user?.role === "ADMIN"|| user?.role === "CEO" || user?.role === "DIRECTOR") && (
        <div className="min-h-screen p-6">
        <VacationRequestList />
        </div>
    )}
    {(user?.role === "CLERK" || user?.role === "DELIVERYMAN"|| user?.role === "SALESMAN") && (
      <>
        <VacationRequestForm />
        <MyVacationRequestList />
      </>
    )}
    </>
  );
}

export default Vacation;