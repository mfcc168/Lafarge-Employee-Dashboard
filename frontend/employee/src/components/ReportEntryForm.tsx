import { ReportEntryFormProps } from "@interfaces/index";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const ReportEntryForm = ({
  entries,
  submitting,
  pagedDate,
  currentPage,
  sortedDates,
  setCurrentPage,
  handleChange,
  handleSubmitEntry,
  handleDelete,
  addEmptyEntry
}: ReportEntryFormProps) => {

  return (
    <div className="space-y-6">
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-6 mt-8 mb-4">
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= sortedDates.length - 1}
          className={`flex items-center justify-center p-3 rounded-full transition 
            ${currentPage >= sortedDates.length - 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}
          `}
          aria-label="Prev date"
          title="Prev Date"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="text-gray-700 font-medium select-none">
          {sortedDates[currentPage]}
        </div>
        
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 0}
          className={`flex items-center justify-center p-3 rounded-full transition 
            ${currentPage === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}
          `}
          aria-label="Next date"
          title="Next Date"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {entries.length === 0 && (
          <div className="px-6 py-4 text-center text-gray-500 italic bg-white rounded-lg shadow">
            No entries available for this date.
          </div>
        )}

        {entries.map((entry, index) => (
          <div key={entry.id || `new-${index}`} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-52">Time Range</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-60">Client Name</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">District</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Type</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">New?</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Orders</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Tel Orders</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Samples</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">New Product Intro</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Old Product Followup</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Delivery Time Update</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    {/* Time Range - Now Wider */}
                    <td className="px-2 py-4">
                      <input
                        type="text"
                        value={entry.time_range}
                        onChange={(e) => handleChange(index, 'time_range', e.target.value)}
                        className="w-30 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      />
                    </td>

                    {/* Doctor Name */}
                    <td className="px-2 py-4">
                      <input
                        type="text"
                        value={entry.doctor_name}
                        onChange={(e) => handleChange(index, 'doctor_name', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </td>

                    {/* District */}
                    <td className="px-2 py-4">
                      <input
                        type="text"
                        value={entry.district}
                        onChange={(e) => handleChange(index, 'district', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </td>

                    {/* Client Type */}
                    <td className="px-2 py-4">
                      <select
                        value={entry.client_type}
                        onChange={(e) => handleChange(index, 'client_type', e.target.value as 'doctor' | 'nurse')}
                        className="w-30 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                      </select>
                    </td>

                    {/* New Client */}
                    <td className="px-2 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={entry.new_client}
                        onChange={(e) => handleChange(index, 'new_client', e.target.checked)}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>

                    {/* Orders */}
                    <td className="px-2 py-4">
                      <textarea
                        value={entry.orders}
                        onChange={(e) => handleChange(index, 'orders', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </td>

                    {/* Tel Orders */}
                    <td className="px-2 py-4">
                      <textarea
                        value={entry.tel_orders}
                        onChange={(e) => handleChange(index, 'tel_orders', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </td>

                    {/* Samples */}
                    <td className="px-2 py-4">
                      <textarea
                        value={entry.samples}
                        onChange={(e) => handleChange(index, 'samples', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </td>

                    {/* New Product Intro */}
                    <td className="px-2 py-4">
                      <textarea
                        value={entry.new_product_intro || ''}
                        onChange={(e) => handleChange(index, 'new_product_intro', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </td>

                    {/* Old Product Followup */}
                    <td className="px-2 py-4">
                      <textarea
                        value={entry.old_product_followup || ''}
                        onChange={(e) => handleChange(index, 'old_product_followup', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </td>

                    {/* Delivery Time Update */}
                    <td className="px-2 py-4">
                      <textarea
                        value={entry.delivery_time_update || ''}
                        onChange={(e) => handleChange(index, 'delivery_time_update', e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Actions outside the table */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-4">
              <button
                onClick={() => handleSubmitEntry(index)}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Entry"}
              </button>
              <button
                onClick={() => handleDelete(index)}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Delete Entry
              </button>
            </div>
          </div>
        ))}
      </div>

      

      {/* Add New Entry Button */}
      <div className="flex">
        <button
          type="button"
          onClick={addEmptyEntry}
          className="flex items-center justify-center gap-3 py-3 px-6 bg-indigo-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition"
        >
          <Plus size={20} />
          Add New Entry
        </button>
      </div>
    </div>
  );
};

export default ReportEntryForm;