import { LazyReportEntryForm as ReportEntryForm } from '@components/LazyComponents';

const Report = () => {

  return (
    <div className="min-h-screen w-full bg-gradient-to-br flex items-center justify-center h-screen">
      <div className="w-full h-full py-8">
        <ReportEntryForm />
      </div>
    </div>
  );
};

export default Report;