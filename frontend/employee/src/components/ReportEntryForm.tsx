import { useAuth } from "@context/AuthContext";
import { ChevronLeft, ChevronRight, Plus, SaveAll, Save, Trash2 } from "lucide-react";
import AutocompleteInput from "@components/AutoCompleteInput";
import { useEffect, useRef, useCallback } from "react";
import { useReportEntryForm } from "@hooks/useReportEntryForm";
import LoadingSpinner from "@components/LoadingSpinner";

/**
 * ReportEntryForm Component
 * 
 * A complex form for managing daily sales report entries with:
 * - Pagination by date
 * - Dynamic form fields with autocomplete
 * - Keyboard navigation
 * - Bulk and individual save operations
 * - Responsive table layout
 * 
 * Features:
 * - Automatic saving when navigating between entries
 * - Textarea auto-resizing
 * - Role-based field suggestions
 * - Visual indicators for saved/unsaved entries
 */
const ReportEntryForm = () => {
  const {
    entries,
    unsavedEntriesRef,
    newestEntryIndex,
    isLoading,
    submitting,
    currentPage,
    sortedDates,
    doctorNameSuggestions,
    districtSuggestions,
    // getTelOrderSuggestions,
    setCurrentPage,
    handleChange,
    handleSubmitEntry,
    handleSubmitAllEntries,
    handleDelete,
    addEmptyEntry,
  } = useReportEntryForm();

  const { user } = useAuth();

  const entriesRef = useRef<HTMLDivElement>(null);
  const focusedEntryIndex = useRef<number | null>(null);

  /**
   * Adjusts textarea height based on content - Memoized for performance
   * @param {React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>} e - The change event
   */
  const adjustTextareaHeight = useCallback((
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const textarea = e.target;
    if (textarea instanceof HTMLTextAreaElement) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, []);

  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (focusedEntryIndex.current === null) return;
        
        e.preventDefault();
        
        const direction = e.key === 'ArrowUp' ? -1 : 1;
        const newIndex = focusedEntryIndex.current + direction;
        
        if (newIndex >= 0 && newIndex < entries.length) {
          const entryElements = entriesRef.current?.querySelectorAll('.entry-container');
          if (entryElements && entryElements[newIndex]) {
            const firstInput = entryElements[newIndex].querySelector('input, textarea') as HTMLElement;
            firstInput?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entries]);

  /**
   * Handles focus events on form fields - Memoized for performance
   * @param {number} index - The index of the focused entry
   */
  const handleFocus = useCallback(async (index: number) => {
    // Add new entry if focusing on the newest row
    if (index === newestEntryIndex) {
      addEmptyEntry();
    }
    
    // Save previous entry if it was modified
    const prevIndex = focusedEntryIndex.current;

    if (prevIndex !== null && prevIndex !== index) {
      const prevEntry = entries[prevIndex];

      const isUnsaved = !prevEntry?.id && unsavedEntriesRef.current.includes(prevEntry);

      if (isUnsaved) {
        await handleSubmitEntry(prevIndex);
      }
    }

    focusedEntryIndex.current = index;
  }, [newestEntryIndex, addEmptyEntry, entries, unsavedEntriesRef, handleSubmitEntry]);

  // Loading state
  if (isLoading) {
    return (
      <LoadingSpinner />
    )
  }
  
  return (
    <div className="space-y-6" ref={entriesRef}>
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-6 mt-8 mb-4">
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= sortedDates.length - 1}
          className={`flex items-center justify-center p-3 rounded-full transition 
            ${currentPage >= sortedDates.length - 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-slate-600 text-white hover:bg-slate-700"}
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
            ${currentPage === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-slate-600 text-white hover:bg-slate-700"}
          `}
          aria-label="Next date"
          title="Next Date"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex-grow min-h-0 overflow-y-auto space-y-4">
        {entries.length === 0 && (
          <div className="px-6 py-4 text-center text-gray-500 italic bg-white rounded-lg shadow">
            No entries available for this date.
          </div>
        )}

        {entries.map((entry, index) => (
          <div
            key={entry.id || `new-${index}`}
            className={`entry-container rounded-lg shadow-md overflow-hidden border-l-4 ${
              entry.id ? "border-emerald-400" : "border-emerald-500"
            }`}
          >
            <div className="overflow-x-auto max-w-full">
              <table className="min-w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-52">Time Range</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-60">Client Name</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">District</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Orders</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Tel Orders</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Samples</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">New Product Intro</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-72">Old Product Followup</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* First Row - Main Inputs */}
                  <tr>
                    <td className="px-1 py-4">
                      <input
                        type="text"
                        value={entry.time_range}
                        onChange={(e) => handleChange(index, 'time_range', e.target.value)}
                        className="w-full max-w-xs min-w-[6rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        onFocus={() => handleFocus(index)}
                      />
                    </td>
                    <td className="px-1 py-4">
                      <AutocompleteInput
                        value={entry.doctor_name}
                        onChange={(e) => handleChange(index, 'doctor_name', e.target.value)}
                        suggestions={doctorNameSuggestions}
                        className="w-full max-w-xs min-w-[6rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        inputProps={{ 
                          maxLength: 20,
                          onFocus: () => handleFocus(index)
                        }}
                      />
                    </td>
                    <td className="px-1 py-4">
                      <AutocompleteInput
                        value={entry.district}
                        onChange={(e) => handleChange(index, 'district', e.target.value)}
                        suggestions={districtSuggestions}
                        className="w-full max-w-xs min-w-[6rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        inputProps={{ 
                          maxLength: 20,
                          onFocus: () => handleFocus(index)
                        }}
                      />
                    </td>

                    <td className="px-1 py-4">
                      <textarea
                        value={entry.orders}
                        onChange={(e) => {handleChange(index, 'orders', e.target.value);adjustTextareaHeight(e);}}
                        className="w-full max-w-md min-w-[14rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        rows={2}
                        onFocus={() => handleFocus(index)}
                      />
                    </td>
                    <td className="px-1 py-4">
                      <textarea
                        value={entry.tel_orders}
                        onChange={(e) => {handleChange(index, 'tel_orders', e.target.value);adjustTextareaHeight(e);}}
                        className="w-full max-w-md min-w-[14rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        rows={2}
                        onFocus={() => handleFocus(index)}
                      />
                      {/* <AutocompleteInput
                        value={entry.tel_orders}
                        onChange={(e) => {handleChange(index, "tel_orders", e.target.value);adjustTextareaHeight(e);}}
                        suggestions={getTelOrderSuggestions(entry.doctor_name)}
                        isTextarea={true}
                        openOnFocus={true}
                        className="w-full max-w-md min-w-[14rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        textareaProps={{
                          onFocus: () => handleFocus(index)
                        }}
                      /> */}
                    </td>
                    <td className="px-1 py-4">
                      <textarea
                        value={entry.samples}
                        onChange={(e) => {handleChange(index, 'samples', e.target.value);adjustTextareaHeight(e);}}
                        className="w-full max-w-md min-w-[14rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        rows={2}
                        onFocus={() => handleFocus(index)}
                      />
                    </td>
                    <td className="px-1 py-4">
                      <textarea
                        value={entry.new_product_intro || ''}
                        onChange={(e) => {handleChange(index, 'new_product_intro', e.target.value);adjustTextareaHeight(e);}}
                        className="w-full max-w-md min-w-[14rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        rows={2}
                        onFocus={() => handleFocus(index)}
                      />
                    </td>
                    <td className="px-1 py-4">
                      <textarea
                        value={entry.old_product_followup || ''}
                        onChange={(e) => {handleChange(index, 'old_product_followup', e.target.value);adjustTextareaHeight(e);}}
                        className="w-full max-w-md min-w-[14rem] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                        rows={2}
                        onFocus={() => handleFocus(index)}
                      />
                    </td>
                  </tr>

                  {/* Second Row - Type & New? */}
                  <tr>
                    <td className="px-1 py-3 font-medium text-sm text-gray-700" colSpan={3}>
                      <select
                        value={entry.client_type}
                        onChange={(e) => handleChange(index, 'client_type', e.target.value as 'doctor' | 'nurse')}
                        className="w-36 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 bg-white bg-white"
                        onFocus={() => handleFocus(index)}
                      >
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                      </select>
                    </td>
                    <td className="px-1 py-3 font-medium text-sm text-gray-700" colSpan={3}>
                      New Client?
                      <input
                        type="checkbox"
                        checked={entry.new_client}
                        onChange={(e) => handleChange(index, 'new_client', e.target.checked)}
                        className="ml-3 h-5 w-5 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                        onFocus={() => handleFocus(index)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Actions outside the table */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => handleSubmitEntry(index)}
                disabled={submitting}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${entry.id ? "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400" : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"} shadow-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-50`}>
                <Save size={15} />
                {submitting
                  ? entry.id
                    ? "Updating..."
                    : "Saving..."
                  : entry.id
                  ? "Update"
                  : "Save"}
              </button>
              <button
                onClick={() => handleDelete(index)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all duration-fast shadow-md hover:shadow-lg disabled:opacity-50 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={addEmptyEntry}
          className="group relative inline-flex items-center justify-center p-3 bg-gradient-to-br from-slate-600 to-emerald-600 hover:from-slate-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-50"
        >
          <Plus 
            size={18} 
            className="transform group-hover:rotate-90 transition-transform duration-200 ease-in-out" 
          />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap">
            Add New Entry
          </span>
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10"></span>
        </button>
      </div>

      <div>
        <p>I, {user?.username}, declare the following data provided are true and correct</p>
      </div>
      
      <div className="flex flex-wrap gap-4 mt-4">
        <button
          onClick={handleSubmitAllEntries}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white text-base font-medium rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 transition"
        >
          <SaveAll size={15} />
          {submitting ? "Saving All..." : "Save All"}
        </button>
      </div>
    </div>
  );
};

export default ReportEntryForm;