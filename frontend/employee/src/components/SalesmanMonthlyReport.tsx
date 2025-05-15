import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import LoadingSpinner from "@components/LoadingSpinner";
import ErrorMessage from "@components/ErrorMessage";
import { useSalesmanMonthlyReport } from "@hooks/useSalesmanMonthlyReport";
import { Invoice, SalesmanMonthlyReportProps} from "@interfaces/index";

const SalesmanMonthlyReport = ({ salesmanName, year, month }: SalesmanMonthlyReportProps) => {
  const {
    data,
    isLoading,
    error,
    expandedWeek,
    currentPage,
    invoicesPerPage,
    paginateInvoices,
    handleNextPage,
    handlePrevPage,
    handleExpandWeek
  } = useSalesmanMonthlyReport({ salesmanName, year, month });
  const weekRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expandedWeek !== null && weekRef.current) {
      weekRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [expandedWeek, currentPage]);

  
  if (isLoading) return <LoadingSpinner />;

  

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl">
      {error ? (
        <ErrorMessage message={`Oops! ${error}`} type="error" />
      ) : !data ? (
        <ErrorMessage message="No data available." type="no-data" />
      ) : (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Sales Performance Report
            </h1>
            <h2 className="text-xl font-semibold text-indigo-600 mb-1">
              {data.salesman} - {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Monthly Total</h3>
                <p className="text-2xl font-bold text-gray-800">${data.sales_monthly_total.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Incentive</h3>
                <p className="text-2xl font-bold text-gray-800">{data.incentive_percentage*100}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Bonus</h3>
                <p className="text-2xl font-bold text-gray-800">10%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-500 uppercase">Commission</h3>
                <p className="text-2xl font-bold text-gray-800">${data.commission.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {data.weeks &&
              Object.keys(data.weeks).map((weekNum) => {
                const weekNumber = Number(weekNum);
                return (
                  <div key={weekNumber} 
                  ref={expandedWeek === weekNumber ? weekRef : null}
                  className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => handleExpandWeek(weekNumber)}
                      className="w-full flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-800">Week {weekNumber}</h3>
                          <p className="text-sm text-gray-500">
                            {data.weeks[weekNumber]?.invoices.length} invoices
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">
                          ${data.weeks[weekNumber]?.total.toFixed(2)}
                        </span>
                        {expandedWeek === weekNumber ? (
                          <ChevronUp size={20} className="text-indigo-600" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-500" />
                        )}
                      </div>
                    </button>

                    {expandedWeek === weekNumber && (
                      <div className="border-t border-gray-200">
                        <ul className="divide-y divide-gray-200">
                          {paginateInvoices(data.weeks[weekNumber]?.invoices).map((invoice: Invoice, index: number) => (
                            <li
                              key={index}
                              className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-gray-800 flex items-center">
                                    Invoice #{invoice.number}
                                  </h4>
                                  <p className="text-gray-600 text-sm mt-1">
                                    <span className="font-medium">Customer:</span> {invoice.customer} 
                                    {invoice.care_of && <span className="text-gray-500"> ({invoice.care_of})</span>}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-indigo-600">
                                    ${invoice.total_price.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Delivery: {new Date(invoice.delivery_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Items section */}
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-gray-700 mb-1">Items:</h5>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {invoice.items.map((item, itemIndex) => (
                                    <li 
                                      key={itemIndex}
                                      className="bg-gray-50 px-3 py-2 rounded text-sm text-gray-700 flex items-center"
                                    >
                                      {/* <span className="w-5 h-5 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center text-xs mr-2">
                                        {itemIndex + 1}
                                      </span> */}
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </li>
                          ))}
                        </ul>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                          <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-md flex items-center ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                          >
                            Previous
                          </button>
                          <button
                            onClick={handleNextPage}
                            disabled={currentPage * invoicesPerPage >= data.weeks[weekNumber]?.invoices.length}
                            className={`px-4 py-2 rounded-md flex items-center ${currentPage * invoicesPerPage >= data.weeks[weekNumber]?.invoices.length ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300">
                <button
                  className="w-full flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800">HK Health LTd</h3>
                      <p className="text-sm text-gray-500">
                      ${data.monthly_total_share.toFixed(2)} * {data.monthly_total_share_percentage*100}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">
                      ${data.personal_monthly_total_share.toFixed(2)}
                    </span>
                    <ChevronDown size={20} className="text-gray-500" />
                  </div>   
                </button>
                </div>

          </div>
        </>
      )}
    </div>
  );
};

export default SalesmanMonthlyReport;