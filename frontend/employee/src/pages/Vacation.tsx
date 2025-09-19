import { LazyVacationRequestForm as VacationRequestForm } from '@components/LazyComponents';
import MyVacationRequestList from '@components/MyVacationRequestList';
import { useAuth } from '@context/AuthContext';
import VacationRequestList from '@components/VacationRequestList';
import { ALL_MANAGEMENT, hasRole } from '@utils/permissions';

const Vacation = () => {

  const { user } = useAuth(); 
  const canApproveVacations = hasRole(user?.role, ALL_MANAGEMENT);
  const isRegularEmployee = user?.role && !canApproveVacations;

  return (
    <>
    {canApproveVacations && (
        <div className="min-h-screen p-6">
        <VacationRequestList />
        </div>
    )}
    {isRegularEmployee && (
      <>
        <VacationRequestForm />
        <MyVacationRequestList />
      </>
    )}
    </>
  );
}

export default Vacation;