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
    <div className="min-h-screen animate-fadeIn">
      {canApproveVacations && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-slate-700 to-emerald-600 rounded-2xl p-8 text-white shadow-soft animate-fadeInDown">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold font-display mb-2">Vacation Management</h1>
                <p className="text-slate-100 text-lg">Review and approve vacation requests</p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-6 border border-gray-100">
            <VacationRequestList />
          </div>
        </div>
      )}
      {isRegularEmployee && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-slate-700 to-emerald-600 rounded-2xl p-8 text-white shadow-soft animate-fadeInDown">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold font-display mb-2">My Vacation</h1>
                <p className="text-slate-100 text-lg">Submit requests and track your vacation days</p>
              </div>
              <div className="hidden md:block">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <VacationRequestForm />
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-6 border border-gray-100">
            <MyVacationRequestList />
          </div>
        </div>
      )}
    </div>
  );
}

export default Vacation;