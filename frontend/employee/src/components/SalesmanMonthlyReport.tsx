import { ChevronDown, ChevronUp } from "lucide-react";
import LoadingSpinner from "@components/LoadingSpinner";
import ErrorMessage from "@components/ErrorMessage";
import { useSalesmanMonthlyReport } from "@hooks/useSalesmanMonthlyReport";
import { Invoice, SalesmanMonthlyReportProps } from "@interfaces/index";

/**
 * SalesmanMonthlyReport Component
 * 
 * Displays a comprehensive monthly sales report for a salesman with:
 * - Month navigation controls
 * - Summary statistics (total sales, commission, etc.)
 * - Weekly breakdown with expandable invoice details
 * - Pagination for invoice lists
 */
const SalesmanMonthlyReport = ({ salesmanName }: SalesmanMonthlyReportProps) => {
  const {
    data,
    isLoading,
    error,
    expandedWeek,
    currentPage,
    invoicesPerPage,
    weekRef,
    sharedRef,
    currentDate,
    canGoPrevious,
    canGoNext,
    sharedExpanded,
    toggleSharedExpanded,
    navigateMonth,
    paginateInvoices,
    handleNextPage,
    handlePrevPage,
    handleExpandWeek
  } = useSalesmanMonthlyReport({ salesmanName });

  // Date information
  const year = currentDate.year;
  const month = currentDate.month;

  // Month names for display
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Loading state
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Error handling */}
      {error ? (
        <ErrorMessage message={`Oops! ${error}`} type="error" />
      ) : !data ? (
        <ErrorMessage message="No data available." type="warning" />
      ) : (
        <>
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-8 border border-gray-100">
            {/* Title with icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 font-display">Monthly Sales Report</h1>
                <p className="text-slate-600 font-medium">{data.salesman}</p>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex justify-center items-center mb-6">
              <div className="flex items-center space-x-4 text-center">
                {canGoPrevious && (
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Previous month"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}

                <div className="text-center min-w-[200px]">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {monthNames[month - 1]} {year}
                  </h2>
                </div>

                {canGoNext && (
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Next month"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Monthly Total</h3>
                <p className="text-2xl font-bold text-slate-800">${data.sales_monthly_total.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Incentive</h3>
                <p className="text-2xl font-bold text-slate-800">{data.incentive_percentage * 100}%</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Bonus</h3>
                <p className="text-2xl font-bold text-slate-800">10%</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-2">Commission</h3>
                <p className="text-2xl font-bold text-emerald-800">${data.commission.toFixed(2)}</p>
              </div>
            </div>
          </div>


          {/* Weekly breakdown */}
          <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 font-display">Weekly Breakdown</h2>
                <p className="text-sm text-slate-500 font-medium">Detailed invoice breakdown by week</p>
              </div>
            </div>
            
            <div className="space-y-4">
            {data.weeks &&
              Object.keys(data.weeks).map((weekNum) => {
                const weekNumber = Number(weekNum);
                return (
                  <div 
                    key={weekNumber} 
                    ref={expandedWeek === weekNumber ? weekRef : null}
                    className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    {/* Week summary header */}
                    <button
                      onClick={() => handleExpandWeek(weekNumber)}
                      className="w-full flex justify-between items-center px-6 py-4 hover:bg-slate-100 transition-colors duration-200"
                      aria-expanded={expandedWeek === weekNumber}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{weekNumber}</span>
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-slate-800">Week {weekNumber}</h3>
                          <p className="text-sm text-slate-500">
                            {data.weeks[weekNumber]?.invoices.length} invoices
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-800 text-lg">
                          ${data.weeks[weekNumber]?.total.toFixed(2)}
                        </span>
                        {expandedWeek === weekNumber ? (
                          <ChevronUp size={20} className="text-slate-600" />
                        ) : (
                          <ChevronDown size={20} className="text-slate-500" />
                        )}
                      </div>
                    </button>

                    {/* Expanded week details */}
                    {expandedWeek === weekNumber && (
                      <div className="border-t border-slate-200 bg-white">
                        <ul className="divide-y divide-slate-100">
                          {paginateInvoices(data.weeks[weekNumber]?.invoices).map((invoice: Invoice, index: number) => (
                            <li
                              key={index}
                              className="px-6 py-4 hover:bg-slate-50 transition-colors duration-150"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                                      #{invoice.number}
                                    </span>
                                    <h4 className="font-bold text-slate-800">Invoice</h4>
                                  </div>
                                  <p className="text-slate-600 text-sm">
                                    <span className="font-medium">Customer:</span> {invoice.customer} 
                                    {invoice.care_of && <span className="text-slate-500"> ({invoice.care_of})</span>}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-emerald-600">
                                    ${invoice.total_price.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Delivery: {new Date(invoice.delivery_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Invoice items */}
                              <div className="mt-4">
                                <h5 className="text-sm font-bold text-slate-700 mb-2">Items:</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {invoice.items.map((item, itemIndex) => (
                                    <div 
                                      key={itemIndex}
                                      className="bg-slate-100 px-3 py-2 rounded-lg text-sm text-slate-700 border border-slate-200"
                                    >
                                      {item}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>

                        {/* Pagination controls */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-600 text-white hover:bg-slate-700'}`}
                          >
                            Previous
                          </button>
                          <span className="text-sm text-slate-600 font-medium">
                            Page {currentPage} of {Math.ceil(data.weeks[weekNumber]?.invoices.length / invoicesPerPage)}
                          </span>
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage * invoicesPerPage >= data.weeks[weekNumber]?.invoices.length}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage * invoicesPerPage >= data.weeks[weekNumber]?.invoices.length ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-600 text-white hover:bg-slate-700'}`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Shared sales section */}
            <div 
              ref={sharedExpanded ? sharedRef : null}
              className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <button
                onClick={toggleSharedExpanded}
                className="w-full flex justify-between items-center px-6 py-4 hover:bg-emerald-100 transition-colors duration-200"
                aria-expanded={sharedExpanded}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-emerald-800">Shared Sales</h3>
                    <p className="text-sm text-emerald-600">
                      ${data.monthly_total_share.toFixed(2)} × {data.monthly_total_share_percentage * 100}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-emerald-800 text-lg">
                    ${data.personal_monthly_total_share.toFixed(2)}
                  </span>
                  {sharedExpanded ? (
                    <ChevronUp size={20} className="text-emerald-600" />
                  ) : (
                    <ChevronDown size={20} className="text-emerald-600" />
                  )}
                </div>
              </button>

              {sharedExpanded && (
                <div className="border-t border-emerald-200 bg-white">
                  <ul className="divide-y divide-emerald-100">
                    {data.invoice_shares_data.map((invoice: Invoice, index: number) => (
                      <li key={index} className="px-6 py-4 hover:bg-emerald-50 transition-colors duration-150">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold">
                                #{invoice.number}
                              </span>
                              <h4 className="font-bold text-slate-800">Shared Invoice</h4>
                            </div>
                            <p className="text-slate-600 text-sm">
                              <span className="font-medium">Customer:</span> {invoice.customer}
                              {invoice.care_of && <span className="text-slate-500"> ({invoice.care_of})</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-emerald-600">
                              ${invoice.total_price.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Delivery: {new Date(invoice.delivery_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Shared invoice items */}
                        <div className="mt-4">
                          <h5 className="text-sm font-bold text-slate-700 mb-2">Items:</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {invoice.items.map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="bg-emerald-100 px-3 py-2 rounded-lg text-sm text-emerald-800 border border-emerald-200"
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesmanMonthlyReport;