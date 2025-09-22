import { LazyAllEmployeePayroll as AllEmployeePayroll } from '@components/LazyComponents';
import { useAuth } from '@context/AuthContext';
import { canViewPayroll } from '@utils/permissions';

const Payroll = () => {

    const { user } = useAuth();
    const hasPayrollAccess = canViewPayroll(user?.role);

    return (
        <>
            {hasPayrollAccess && <AllEmployeePayroll />}
        </>
    );
};

export default Payroll;
