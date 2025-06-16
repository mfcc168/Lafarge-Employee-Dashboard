import { useAuth } from "@context/AuthContext";
import VacationRequestList from "@components/VacationRequestList";
import ReportEntryList from "@components/ReportEntryList";

const Home = () => {
  const { user } = useAuth();


  return (
    <div className="min-h-screen p-6">
        <ReportEntryList />
      {(user?.role === "MANAGER" || user?.role === "ADMIN"|| user?.role === "CEO" || user?.role === "DIRECTOR") && (
        <VacationRequestList />
      )}
    </div>
  );
}

export default Home;