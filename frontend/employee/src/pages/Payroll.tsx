import { LazyAllEmployeePayroll as AllEmployeePayroll } from '@components/LazyComponents';
import { useAuth } from '@context/AuthContext';

const Payroll = () => {

    const { user } = useAuth();
    const isManagerialRole = ["ADMIN", "DIRECTOR"].includes(user?.role || "");


    return (
        <>
            {isManagerialRole && <AllEmployeePayroll />}
        </>
    );
};

export default Payroll;
