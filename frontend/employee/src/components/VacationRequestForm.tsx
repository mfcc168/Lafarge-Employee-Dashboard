import { Plus, Trash2, Loader2 } from "lucide-react";
import { useVacationRequestForm } from "@hooks/useVacationRequestForm";
import SignaturePad from "@components/SignaturePad";

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
    excludedDates,
    signatureData,
    setSignatureData,
    clearSignature,
  } = useVacationRequestForm();

  return (
    <div className="surface surface-pad vacation-form">
      {/* Form Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 font-display">
          Vacation Request
        </h2>
        <p className="text-gray-600">
          Submit your vacation request with flexible date options
        </p>
      </div>

      {/* Date Items Section */}
      <div className="space-y-4">
        {dateItems.map((item, index) => {
          return (
            <div key={index} className="vacation-date-card">
              {/* Vacation Type Selector */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <select
                  value={item.type}
                  onChange={(e) => {
                    const newType = e.target.value as "full" | "half";
                    updateItem(
                      index,
                      newType === "full"
                        ? {
                            type: "full",
                            leave_type: item.leave_type || "Annual Leave",
                            from_date: "",
                            to_date: "",
                          }
                        : {
                            type: "half",
                            leave_type: item.leave_type || "Annual Leave",
                            single_date: "",
                            half_day_period: "AM",
                          },
                    );
                  }}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-20 transition-colors duration-fast font-medium"
                  aria-label="Day length"
                >
                  <option value="full">Full Day</option>
                  <option value="half">Half Day</option>
                </select>

                <select
                  value={item.leave_type}
                  onChange={(e) => {
                    updateItem(index, {
                      ...item,
                      leave_type: e.target.value as
                        "Annual Leave" | "Sick Leave",
                    });
                  }}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-500 focus:ring-opacity-20 transition-colors duration-fast font-medium"
                  aria-label="Leave type"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                </select>
              </div>

              {/* Full Day Vacation Inputs */}
              {item.type === "full" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm text-gray-600 mb-1"
                      htmlFor={`vacation-from-${index}`}
                    >
                      From Date
                    </label>
                    <input
                      id={`vacation-from-${index}`}
                      aria-label="From date"
                      type="date"
                      value={item.from_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          from_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm text-gray-600 mb-1"
                      htmlFor={`vacation-to-${index}`}
                    >
                      To Date
                    </label>
                    <input
                      id={`vacation-to-${index}`}
                      aria-label="To date"
                      type="date"
                      value={item.to_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          to_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                      aria-required="true"
                      min={item.from_date} // Prevent selecting end date before start date
                    />
                  </div>
                </div>
              ) : (
                /* Half Day Vacation Inputs */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm text-gray-600 mb-1"
                      htmlFor={`vacation-single-${index}`}
                    >
                      Date
                    </label>
                    <input
                      id={`vacation-single-${index}`}
                      aria-label="Date"
                      type="date"
                      value={item.single_date}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          single_date: e.target.value,
                        })
                      }
                      className="bg-white w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                      aria-required="true"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Half Day Period
                    </label>
                    <select
                      value={item.half_day_period || "AM"}
                      onChange={(e) =>
                        updateItem(index, {
                          ...item,
                          half_day_period: e.target.value as "AM" | "PM",
                        })
                      }
                      className="bg-white w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
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
                className="mt-4 flex items-center text-sm text-gray-600 hover:text-gray-700 hover:underline transition-colors duration-fast"
                aria-label={`Remove vacation item ${index + 1}`}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        {" "}
        <button
          onClick={addItem}
          className="flex items-center gap-2 px-6 py-3 rounded-xl  bg-gray-800    text-white text-sm font-medium transition-colors duration-fast shadow-md  transform "
          aria-label="Add another vacation date"
        >
          <Plus className="w-4 h-4" />
          Add another date
        </button>
      </div>

      {/* Signature Section */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-2">
          Employee Signature
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Please sign below to confirm that this vacation request is accurate.
          Use your mouse or finger on touch devices.
        </p>
        <SignaturePad
          value={signatureData}
          onChange={setSignatureData}
          onClear={clearSignature}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-wrap gap-6 mt-6 items-center justify-between">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-3 rounded-xl  bg-gray-800    text-white text-sm font-medium transition-colors duration-fast shadow-md  disabled:opacity-50 transform "
          disabled={submitting}
          aria-label="Submit vacation request"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Request"
          )}
        </button>
      </div>

      {/* Vacation Day Summary */}
      {typeof getVacationDayLeft === "number" && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            Vacation Summary
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            Total Requested:{" "}
            <span className="font-semibold text-gray-600">
              {getTotalVacationDay}
            </span>{" "}
            {getTotalVacationDay === 1 ? "day" : "days"}
          </p>
          <p className="text-sm text-gray-600">
            You have{" "}
            <span
              className={
                getVacationDayLeft < 0 ? "text-gray-600" : "text-gray-600"
              }
            >
              {getVacationDayLeft}
            </span>{" "}
            {getVacationDayLeft === 1 ? "day" : "days"} left.
          </p>

          {/* Excluded Dates Information */}
          {excludedDates.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Excluded dates (not counted as vacation days)
              </h4>
              <div className="space-y-1">
                {excludedDates.map((excludedDate, index) => (
                  <p key={index} className="text-xs text-gray-700">
                    <span className="font-medium">
                      {new Date(excludedDate.date).toLocaleDateString("en-HK", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {" - "}
                    <span>
                      {excludedDate.reason === "Weekend"
                        ? "Weekend"
                        : `Holiday: ${excludedDate.name}`}
                    </span>
                  </p>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2 italic">
                These dates are automatically excluded from your vacation day
                count.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VacationRequestForm;
