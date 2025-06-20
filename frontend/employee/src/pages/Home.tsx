import ReportEntryList from "@components/ReportEntryList";
import WeeklySamplesSummary from "@components/WeeklySamplesSummary";

const Home = () => {



  return (
    <div className="min-h-screen p-6">
        <ReportEntryList />
        <WeeklySamplesSummary />
    </div>
  );
}

export default Home;