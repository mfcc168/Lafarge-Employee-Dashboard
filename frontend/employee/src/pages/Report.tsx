import { useReportEntryForm } from '@hooks/useReportEntryForm';
import LoadingSpinner from '@components/LoadingSpinner'
import ReportEntryForm from '@components/ReportEntryForm';

const Report = () => {
  const {
    entries,
    isLoading,
    submitting,
    pagedDate,
    currentPage,
    sortedDates,
    setCurrentPage,
    handleChange,
    handleSubmitEntry,
    handleSubmitAllEntries,
    handleDelete,
    addEmptyEntry,
  } = useReportEntryForm();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-6">
        <ReportEntryForm 
          entries={entries}
          isLoading={isLoading}
          submitting={submitting}
          pagedDate={pagedDate}
          sortedDates={sortedDates}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
          handleChange={handleChange}
          handleSubmitEntry={handleSubmitEntry}
          handleSubmitAllEntries= {handleSubmitAllEntries}
          handleDelete={handleDelete}
          addEmptyEntry={addEmptyEntry}
        />
        </div>
      </div>
    </div>
  );
};

export default Report;