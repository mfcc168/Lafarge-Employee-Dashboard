import { LazyReportEntryForm as ReportEntryForm } from '@components/LazyComponents';

const Report = () => {

  return (
    <div className="min-h-screen w-full flex items-center justify-center h-screen animate-fadeIn">
      <div className="w-full h-full py-8">
        <ReportEntryForm />
      </div>
    </div>
  );
};

export default Report;