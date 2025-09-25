import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useVacationRequestForm } from '@hooks/useVacationRequestForm';

/**
 * VacationRequestForm Component
 * 
 * A form for submitting vacation requests with:
 * - Support for full-day and half-day vacation types
 * - Dynamic date item management (add/remove/update)
 * - Real-time vacation day calculation
 * - Visual feedback for remaining vacation days
 */
const VacationRequestForm = () => {
  const {
    dateItems,
    submitting,
    addItem,
    updateItem,
    removeItem,
    handleSubmit,
    getTotalVacationDay,
    getVacationDayLeft,
  } = useVacationRequestForm();

  return (
    <div className="max-w-4xl mx-auto px-8 py-10 bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal mt-12 animate-fadeInUp border border-gray-100">
      {/* Form Header */}
      <div className="mb-8 animate-fadeIn">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 font-display">Vacation Request</h2>
        <p className="text-slate-600">Submit your vacation request with flexible date options</p>
      </div>

      {/* Date Items Section */}
      <div className="space-y-4">
        {dateItems.map((item, index) => {
          // Refs for date picker inputs
          let fromDateInput: HTMLInputElement | null = null;
          let toDateInput: HTMLInputElement | null = null;
          let singleDateInput: HTMLInputElement | null = null;

          return (
            <div
              key={index}
              className="border border-gray-200 p-6 rounded-xl bg-gradient-to-r from-gray-50 to-emerald-50/30 shadow-sm hover:shadow-md transition-all duration-fast animate-scaleIn"
            >
              {/* Vacation Type Selector */}
              <div className="flex items-center justify-between mb-3">
                <select
                  value={item.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'full' | 'half';
                    updateItem(
                      index,
                      newType === 'full'
                        ? { type: 'full', from_date: '', to_date: '' }
                        : { type: 'half', single_date: '', half_day_period: 'AM' }
                    );
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 transition-colors duration-fast font-medium"
                  aria-label="Vacation type"
                >
                  <option value="full">Full Day</option>
                  <option value="half">Half Day</option>
                </select>

                <select
                  value={item.leave_type}
                  onChange={(e) => {
                    updateItem(index, {
                      ...item,
                      leave_type: e.target.value as 'Annual Leave' | 'Sick Leave'
                    })
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 transition-colors duration-fast font-medium"
                  aria-label="Vacation type"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                </select>
              </div>

              {/* Full Day Vacation Inputs */}
              {item.type === 'full' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => fromDateInput?.showPicker()}>
                    <label className="block text-sm text-gray-600 mb-1">
                      From Date
                    </label>
                    <input
                      ref={(el) => { fromDateInput = el }}
                      type="date"
                      value={item.from_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          from_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      aria-required="true"
                    />
                  </div>
                  <div onClick={() => toDateInput?.showPicker()}>
                    <label className="block text-sm text-gray-600 mb-1">
                      To Date
                    </label>
                    <input
                      ref={(el) => { toDateInput = el }}
                      type="date"
                      value={item.to_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          to_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      aria-required="true"
                      min={item.from_date} // Prevent selecting end date before start date
                    />
                  </div>
                </div>
              ) : (
                /* Half Day Vacation Inputs */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => singleDateInput?.showPicker()}>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input
                      ref={(el) => { singleDateInput = el }}
                      type="date"
                      value={item.single_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          single_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      aria-required="true"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Half Day Period</label>
                    <select
                      value={item.half_day_period || 'AM'}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          half_day_period: e.target.value as 'AM' | 'PM',
                        })
                      }
                      className="bg-white w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      aria-label="Half day period"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Remove Item Button */}
              <button
                onClick={() => removeItem(index)}
                className="mt-4 flex items-center text-sm text-error-600 hover:text-error-700 hover:underline transition-colors duration-fast"
                aria-label={`Remove vacation item ${index + 1}`}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {/* Form Actions */}
      <div className="flex flex-wrap gap-6 mt-6 items-center justify-between">
        <button
          onClick={addItem}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-sm font-medium transition-all duration-fast shadow-md hover:shadow-lg transform hover:scale-105"
          aria-label="Add another vacation date"
        >
          <Plus className="w-4 h-4" />
          Add Date Item
        </button>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-medium transition-all duration-fast shadow-md hover:shadow-lg disabled:opacity-50 transform hover:scale-105"
          disabled={submitting}
          aria-label="Submit vacation request"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </button>
      </div>

      {/* Vacation Day Summary */}
      {typeof getVacationDayLeft === 'number' && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b border-slate-300 pb-2">
            Vacation Summary
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            Total Requested:{' '}
            <span className="font-semibold text-emerald-600">
              {getTotalVacationDay}
            </span>{' '}
            {getTotalVacationDay === 1 ? 'day' : 'days'}
          </p>
          <p className="text-sm text-slate-600">
            You have{' '}
            <span
              className={getVacationDayLeft < 0 ? 'text-error-600' : 'text-emerald-600'}
            >
              {getVacationDayLeft}
            </span>{' '}
            {getVacationDayLeft === 1 ? 'day' : 'days'} left.
          </p>
        </div>
      )}
    </div>
  );
}

export default VacationRequestForm;