import { LazyEmployeeManagement as EmployeeManagement } from '@components/LazyComponents';
import { useAuth } from '@context/AuthContext';

const Employees = () => {
    const { user } = useAuth();
    const hasAccess = ["ADMIN", "DIRECTOR", "CEO",].includes(user?.role || "");

    return (
        <>
            {hasAccess && <EmployeeManagement />}
            {!hasAccess && (
                <div className="max-w-md mx-auto mt-6 text-red-600 font-semibold text-center">
                    You do not have permission to access this page.
                </div>
            )}
        </>
    );
};

export default Employees;