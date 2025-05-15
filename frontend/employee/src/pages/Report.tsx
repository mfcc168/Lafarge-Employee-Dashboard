import { useReportEntryForm } from '@hooks/useReportEntryForm';
import LoadingSpinner from '@components/LoadingSpinner'
import ReportEntryForm from '@components/ReportEntryForm';

const Report = () => {
  const {
    entries,
    isLoading,
    submitting,
    collapsedStates,
    pagedDate,
    currentPage,
    sortedDates,
    setCurrentPage,
    handleChange,
    handleSubmitEntry,
    handleDelete,
    toggleCollapse,
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
            collapsedStates={collapsedStates}
            pagedDate={pagedDate}
            sortedDates={sortedDates}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            handleChange={handleChange}
            handleSubmitEntry={handleSubmitEntry}
            handleDelete={handleDelete}
            toggleCollapse={toggleCollapse}
          />
          <button
            type="button"
            onClick={addEmptyEntry}
            className="w-full py-3 px-6 border border-transparent rounded-md shadow-md bg-gray-700 text-white font-semibold text-lg hover:bg-gray-800"
          >
            Add New Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default Report;