import ReportEntryList from "@components/ReportEntryList";
import WeeklyNewClientOrder from "@components/WeeklyNewClientOrder";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";

const Home = () => {



  return (
    <div className="min-h-screen p-6">
        <ReportEntryList />
        <WeeklySamplesSummary />
        <WeeklyNewClientOrder />
    </div>
  );
}

export default Home;