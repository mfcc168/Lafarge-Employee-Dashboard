import { LazyAllEmployeePayroll as AllEmployeePayroll } from '@components/LazyComponents';
import { useAuth } from '@context/AuthContext';
import { canViewPayroll } from '@utils/permissions';

const Payroll = () => {

    const { user } = useAuth();
    const hasPayrollAccess = canViewPayroll(user?.role);

    return (
        <div className="min-h-screen space-y-8 animate-fadeIn">
            {/* Payroll Header */}
            <div className="bg-gradient-to-r from-slate-700 to-emerald-600 rounded-2xl p-8 text-white shadow-soft animate-fadeInDown">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-display mb-2">Payroll Management</h1>
                        <p className="text-slate-100 text-lg">View and manage employee salary information</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {hasPayrollAccess && (
                <div className="animate-scaleIn">
                    <AllEmployeePayroll />
                </div>
            )}
        </div>
    );
};

export default Payroll;
