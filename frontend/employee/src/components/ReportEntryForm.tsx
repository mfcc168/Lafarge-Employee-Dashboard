import { ReportEntryFormProps } from "@interfaces/index";
import { ChevronDown, ChevronUp } from "lucide-react";

const ReportEntryForm = ({
  entries,
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
}: ReportEntryFormProps) => {

  return (
    <>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Entries for {pagedDate}
      </h2>
      {entries.length === 0 && (
          <p className="text-center text-gray-500 italic mb-6">
            No entries available for this date.
          </p>
        )}
      {entries.map((entry, index) => (
        <div
          key={entry.id || `new-${index}`}
          className="bg-white shadow-xl rounded-lg overflow-hidden mb-6"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-indigo-700 flex items-center">
                {entry.id ? `(${entry.time_range}) ${entry.doctor_name}` : "New Visit Entry"}
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  disabled={submitting}
                  className="ml-5 text-red-500 hover:text-red-700 flex items-center text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Remove
                </button>
              </h3>
              <div className="flex space-x-2 items-center">
                <button
                  type="button"
                  onClick={() => toggleCollapse(index)}
                  className="text-indigo-600 hover:underline text-sm font-medium"
                >
                  {collapsedStates[index] ? (<ChevronDown size={20} className="text-gray-500" />) : (<ChevronUp size={20} className="text-indigo-600" />)}
                </button>
              </div>
            </div>
          </div>

          {!collapsedStates[index] && (
            <div className="p-6 space-y-4">
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-700">Visit Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input
                      type="date"
                      value={entry.date}
                      onChange={(e) => handleChange(index, 'date', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={entry.time_range}
                      onChange={(e) => handleChange(index, 'time_range', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Time Range e.g., 10:30am–11:00am"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-700">Client Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <input
                      type="text"
                      value={entry.doctor_name}
                      onChange={(e) => handleChange(index, 'doctor_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Client Name"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={entry.district}
                      onChange={(e) => handleChange(index, 'district', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="District/Area"
                    />
                  </div>
                  <div>
                    <select
                      value={entry.client_type}
                      onChange={(e) => handleChange(index, 'client_type', e.target.value as 'doctor' | 'nurse')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`new-client-${index}`}
                      checked={entry.new_client}
                      onChange={(e) => handleChange(index, 'new_client', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`new-client-${index}`} className="ml-2 block text-sm text-gray-700">
                      New Client?
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-700">Orders Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <textarea
                      value={entry.orders}
                      onChange={(e) => handleChange(index, 'orders', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Details of orders placed"
                    />
                  </div>
                  <div>
                    <textarea
                      value={entry.tel_orders}
                      onChange={(e) => handleChange(index, 'tel_orders', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Details of tel orders placed"
                    />
                  </div>
                  <div>
                    <textarea
                      value={entry.samples}
                      onChange={(e) => handleChange(index, 'samples', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Details of samples provided"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-700">Additional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <textarea
                      value={entry.new_product_intro}
                      onChange={(e) => handleChange(index, 'new_product_intro', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe new product introductions during the visit"
                      rows={3}
                    />
                  </div>
                  <div>
                    <textarea
                      value={entry.old_product_followup}
                      onChange={(e) => handleChange(index, 'old_product_followup', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe old product followup during the visit"
                      rows={3}
                    />
                  </div>
                </div>
                <div>
                  <textarea
                    value={entry.delivery_time_update}
                    onChange={(e) => handleChange(index, 'delivery_time_update', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Update Delivery Time e.g., 8–1 pm, 4–7 pm. Wed.: Close"
                    rows={2}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => { handleSubmitEntry(index); toggleCollapse(index); }}
                  disabled={submitting}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : entry.id ? "Update Entry" : "Submit Entry"}
                </button>
              </div>
            </div>
          )}  
        </div>
      ))}

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= sortedDates.length - 1}
          className="flex items-center justify-center p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          aria-label="Previous month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
          className="flex items-center justify-center p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
          aria-label="Next month"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

    </>
  );
};

export default ReportEntryForm;
