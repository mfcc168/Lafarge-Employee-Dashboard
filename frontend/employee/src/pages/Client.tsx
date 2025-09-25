import { useGetAllReportEntries } from "@hooks/useGetAllReportEntries";
import { ReportEntry } from "@interfaces/index";
import { useAuth } from '@context/AuthContext';
import { useMemo, useState } from "react";

const Client = () => {
  const { data: entries = [], isLoading, isError } = useGetAllReportEntries();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSalesman, setSelectedSalesman] = useState<string>("all");
  const clientsPerPage = 5;

  const { user } = useAuth();
  const userRole = user?.role;
  const isSalesman = userRole === 'SALESMAN';
  const userFullname = user?.firstname + ' ' + user?.lastname;

  const salesmanList: string[] = useMemo(() => {
    if (!entries) return [];
    const names = new Set<string>();
    entries.forEach((entry: ReportEntry) => {
      if (entry.salesman_name) names.add(entry.salesman_name);
    });
    return Array.from(names);
  }, [entries]);

  // Create aliases mapping for salesmen
  const salesmenAliases = useMemo(() => {
    const aliasMap: Record<string, string> = {
      "Ho Yeung Cheung": "Alex",
      "Hung Ki So": "Dominic", 
      "Kwok Wai Mak": "Matthew",
    };
    return salesmanList.reduce((acc, salesman) => {
      acc[salesman] = aliasMap[salesman] || salesman;
      return acc;
    }, {} as Record<string, string>);
  }, [salesmanList]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-red-600 text-xl font-semibold">Failed to load clients. Please try again.</p>
      </div>
    );
  }

  // Group by client (doctor_name)
  const clientsMap = new Map<string, ReportEntry[]>();
  if (isSalesman) {
    const filtered_entries = entries.filter((entry: ReportEntry) =>
      entry.salesman_name === userFullname
    );
    filtered_entries?.forEach((entry: ReportEntry) => {
    if (!clientsMap.has(entry.doctor_name)) {
      clientsMap.set(entry.doctor_name, []);
    }
    clientsMap.get(entry.doctor_name)?.push(entry);
  });
  } 
  else if (selectedSalesman !== "all") {
    const filtered_entries = entries.filter((entry: ReportEntry) =>
      entry.salesman_name === selectedSalesman
    );
    filtered_entries?.forEach((entry: ReportEntry) => {
    if (!clientsMap.has(entry.doctor_name)) {
      clientsMap.set(entry.doctor_name, []);
    }
    clientsMap.get(entry.doctor_name)?.push(entry);
  });
  }
  else {
    entries?.forEach((entry: ReportEntry) => {
      if (!clientsMap.has(entry.doctor_name)) {
        clientsMap.set(entry.doctor_name, []);
      }
      clientsMap.get(entry.doctor_name)?.push(entry);
    });
  }
  

  // Filter by search and type
  const filteredClients = Array.from(clientsMap.entries()).filter(([clientName]) => {
    const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const paginate = (page: number) => setCurrentPage(page);

  return (
    <div className="min-h-screen space-y-8 animate-fadeIn">
      {/* Client Header */}
      <div className="bg-gradient-to-r from-slate-700 to-emerald-600 rounded-2xl p-8 text-white shadow-soft animate-fadeInDown">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display mb-2">Client Directory</h1>
            <p className="text-slate-100 text-lg">Manage and search through client information</p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-normal p-8 border border-gray-100 animate-scaleIn">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <input
                type="search"
                placeholder="Search clients..."
                className="w-full sm:w-72 px-5 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:outline-none shadow-sm transition"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {/* Salesman filter dropdown */}
              {!isSalesman && 
                <select
                  className="w-full sm:w-56 px-5 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:outline-none shadow-sm transition bg-white cursor-pointer"
                  value={selectedSalesman}
                  onChange={(e) => {
                    setSelectedSalesman(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Salesmen</option>
                  {salesmanList.map((name: string) => (
                    <option key={name} value={name}>
                      {salesmenAliases[name] || name}
                    </option>
                  ))}
                </select>
              }
            </div>
          </div>

          <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredClients.length === 0 ? 0 : indexOfFirstClient + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-slate-800">
              {Math.min(indexOfLastClient, filteredClients.length)}
            </span>{" "}
            of <span className="font-semibold text-slate-800">{filteredClients.length}</span> clients
          </div>
        </div>

        {currentClients.length === 0 ? (
          <div className="py-24 bg-slate-50 rounded-xl shadow-soft text-center text-slate-500 text-lg select-none border border-slate-200">
            <div className="flex flex-col items-center space-y-4">
              <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No clients match your criteria.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-8">
            {currentClients.map(([clientName, entries]) => (
              <li
                key={clientName}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="px-8 py-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <h2 className="text-3xl font-semibold text-gray-900">{clientName}</h2>

                  <div className="flex flex-wrap gap-6 text-gray-700 text-base items-center">
                    <span>District: <strong>{entries[0].district}</strong></span>
                    <span>Visits: <strong>{entries.length}</strong></span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-8 py-5 hover:bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6"
                    >
                      <div className="flex flex-col space-y-1 max-w-lg">
                        <p className="text-sm text-gray-400 font-mono tracking-wide">
                          {entry.date} &bull; {entry.time_range}
                        </p>
                        {entry.orders && <p className="font-semibold text-gray-800">Orders: {entry.orders}</p>}
                        {entry.samples && <p className="text-gray-700">Samples: {entry.samples}</p>}
                        {entry.tel_orders && (
                          <p className="text-gray-700">Telephone Orders: {entry.tel_orders}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="flex items-center gap-3 font-medium">
                          <span
                            className={`inline-block w-5 h-5 rounded-full ${
                              entry.client_type === "doctor" ? "bg-slate-600" : "bg-emerald-600"
                            }`}
                          />
                          {entry.client_type === "doctor" ? "Doctor" : "Nurse"}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-1 rounded-full select-none">
                          {salesmenAliases[entry.salesman_name] || entry.salesman_name}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 sm:justify-end max-w-xs">
                        {entry.new_product_intro && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-4 py-1 rounded-full font-semibold select-none">
                            Product Intro: {entry.new_product_intro}
                          </span>
                        )}
                        {entry.old_product_followup && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-4 py-1 rounded-full font-semibold select-none">
                            Follow up: {entry.old_product_followup}
                          </span>
                        )}
                        {entry.delivery_time_update && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-4 py-1 rounded-full font-semibold select-none">
                            Delivery Update: {entry.delivery_time_update}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}

        <nav
          aria-label="Pagination"
          className="flex justify-center mt-10 select-none"
        >
          {/* Go to First Page */}
          <button
            onClick={() => paginate(1)}
            disabled={currentPage === 1}
            className={`px-5 py-2 rounded-l-xl border border-gray-300 ${
              currentPage === 1
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-white text-slate-700 hover:bg-slate-50"
            } transition`}
            aria-label="First Page"
          >
            {"<<"}
          </button>

          {/* Previous Page */}
          <button
            onClick={() => paginate(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-5 py-2 border-t border-b border-gray-300 ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            } transition`}
            aria-label="Previous Page"
          >
            &lt;
          </button>

          {/* Pagination numbers */}
          {(() => {
            const maxPageButtons = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
            let endPage = startPage + maxPageButtons - 1;
            if (endPage > totalPages) {
              endPage = totalPages;
              startPage = Math.max(1, endPage - maxPageButtons + 1);
            }
            const pageNumbers = [];
            for (let i = startPage; i <= endPage; i++) {
              pageNumbers.push(i);
            }
            return pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                aria-current={currentPage === number ? "page" : undefined}
                className={`px-5 py-2 border-t border-b border-gray-300 ${
                  currentPage === number
                    ? "bg-slate-600 text-white font-semibold"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } transition`}
              >
                {number}
              </button>
            ));
          })()}

          {/* Next Page */}
          <button
            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-5 py-2 border-t border-b border-gray-300 ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            } transition`}
            aria-label="Next Page"
          >
            &gt;
          </button>

          {/* Go to Last Page */}
          <button
            onClick={() => paginate(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-5 py-2 rounded-r-xl border border-gray-300 ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            } transition`}
            aria-label="Last Page"
          >
            {">>"}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Client;
