import { LazyEmployeeManagement as EmployeeManagement } from '@components/LazyComponents';
import { useAuth } from '@context/AuthContext';

const Employees = () => {
    const { user } = useAuth();
    const hasAccess = ["ADMIN", "DIRECTOR", "CEO",].includes(user?.role || "");

    return (
        <div className="min-h-screen space-y-8 animate-fadeIn">
            {/* Employees Header */}
            <div className="bg-gradient-to-r from-slate-700 to-emerald-600 rounded-2xl p-8 text-white shadow-soft animate-fadeInDown">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-display mb-2">Employee Management</h1>
                        <p className="text-slate-100 text-lg">Manage employee profiles and access controls</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {hasAccess && (
                <div className="animate-scaleIn">
                    <EmployeeManagement />
                </div>
            )}
            {!hasAccess && (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 animate-fadeIn">
                    <div className="max-w-md w-full bg-white shadow-soft rounded-2xl p-8 animate-scaleIn border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
                        <p className="text-slate-600 font-semibold">You do not have permission to access this page.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;