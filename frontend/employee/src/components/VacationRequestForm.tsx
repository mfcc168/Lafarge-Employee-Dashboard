import { Plus, Trash2, Loader2 } from 'lucide-react';
import { VacationRequestFormProps } from '@interfaces/index';

const VacationRequestForm = ({
  dateItems,
  submitting,
  getTotalVacationDay,
  getVacationDayLeft,
  addItem,
  updateItem,
  removeItem,
  handleSubmit
}: VacationRequestFormProps) => {

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-10">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        Vacation Request
      </h2>
      <div className="space-y-4">
        {dateItems.map((item, index) => {
          let fromDateInput: HTMLInputElement | null = null;
          let toDateInput: HTMLInputElement | null = null;
          let singleDateInput: HTMLInputElement | null = null;

          return (
            <div
              key={index}
              className="border border-gray-200 p-4 rounded-xl bg-gray-50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <select
                  value={item.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'full' | 'half';
                    updateItem(
                      index,
                      newType === 'full'
                        ? { type: 'full', from_date: '', to_date: '' }
                        : { type: 'half', single_date: '' }
                    );
                  }}
                  className="bg-white border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="full">Full Day</option>
                  <option value="half">Half Day</option>
                </select>
              </div>

              {item.type === 'full' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => fromDateInput?.showPicker()}>
                    <label className="block text-sm text-gray-600 mb-1">
                      From Date
                    </label>
                    <input
                      ref={(el) => {
                        fromDateInput = el;
                      }}
                      type="date"
                      value={item.from_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          from_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div onClick={() => toDateInput?.showPicker()}>
                    <label className="block text-sm text-gray-600 mb-1">
                      To Date
                    </label>
                    <input
                      ref={(el) => {
                        toDateInput = el;
                      }}
                      type="date"
                      value={item.to_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          to_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => singleDateInput?.showPicker()}>
                    <label className="block text-sm text-gray-600 mb-1">Date</label>
                    <input
                      ref={(el) => {
                        singleDateInput = el;
                      }}
                      type="date"
                      value={item.single_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          single_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                      className="bg-white w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

              )}

              <button
                onClick={() => removeItem(index)}
                className="mt-4 flex items-center text-sm text-red-600 hover:underline"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-6 mt-6 items-center justify-between">
        <button
          onClick={addItem}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Date Item
        </button>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          disabled={submitting}
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

      {typeof getVacationDayLeft === 'number' && (
        <div className="mt-6 bg-gray-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-800">Request Summary</h3>
          <p className="text-sm text-gray-600 mt-2">
            Total Requested:{' '}
            <span className="font-semibold text-blue-600">
              {getTotalVacationDay}
            </span>{' '}
            {getTotalVacationDay === 1 ? 'day' : 'days'}
          </p>
          <p className="text-sm text-gray-600">
            You have{' '}
            <span
              className={getVacationDayLeft < 0 ? 'text-red-600' : 'text-green-600'}
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
