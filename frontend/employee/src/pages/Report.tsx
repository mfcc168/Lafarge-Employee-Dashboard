import { useReportEntryForm } from '@hooks/useReportEntryForm';
import LoadingSpinner from '@components/LoadingSpinner'
import ReportEntryForm from '@components/ReportEntryForm';

const Report = () => {
  const {
    entries,
    isLoading,
    submitting,
    submittingAll,
    deleting,
    pagedDate,
    currentPage,
    sortedDates,
    timeRangeSuggestions,
    doctorNameSuggestions,
    districtSuggestions,
    getTelOrderSuggestions,
    setCurrentPage,
    handleChange,
    handleSubmitEntry,
    handleSubmitAllEntries,
    handleDelete,
    addEmptyEntry,
  } = useReportEntryForm();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br flex items-center justify-center h-screen">
      <div className="w-full h-full py-8">
        <ReportEntryForm 
          entries={entries}
          isLoading={isLoading}
          submitting={submitting}
          submittingAll={submittingAll}
          deleting={deleting}
          pagedDate={pagedDate}
          sortedDates={sortedDates}
          timeRangeSuggestions={timeRangeSuggestions}
          doctorNameSuggestions={doctorNameSuggestions}
          districtSuggestions={districtSuggestions}
          getTelOrderSuggestions={getTelOrderSuggestions}
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
  );
};

export default Report;