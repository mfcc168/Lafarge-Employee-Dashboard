import { LazyVacationRequestForm as VacationRequestForm } from "@components/LazyComponents";
import MyVacationRequestList from "@components/MyVacationRequestList";
import VacationRequestList from "@components/VacationRequestList";
import PageHeader from "@components/PageHeader";
import { useAuth } from "@context/AuthContext";
import { ALL_MANAGEMENT, hasRole } from "@utils/permissions";
export default function Vacation() {
  const { user } = useAuth();
  const canApprove = hasRole(user?.role, ALL_MANAGEMENT);
  return (
    <div className="page-stack vacation-page">
      <PageHeader
        eyebrow="TIME TO RECHARGE"
        title={canApprove ? "Vacation management" : "My vacation"}
        description={
          canApprove
            ? "Review your team’s time off and keep everyone in the loop."
            : "Plan your time off and follow the status of your requests."
        }
      />
      {canApprove ? (
        <VacationRequestList />
      ) : (
        user?.role && (
          <>
            <VacationRequestForm />
            <MyVacationRequestList />
          </>
        )
      )}
    </div>
  );
}
