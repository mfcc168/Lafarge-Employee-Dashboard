import { useId, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import LoadingSpinner from "@components/LoadingSpinner";
import PageHeader from "@components/PageHeader";
import { useGetAllReportEntries } from "@hooks/useGetAllReportEntries";
import type { ReportEntry } from "@interfaces/index";
import { useAuth } from "@context/AuthContext";
import { formatDisplayDate } from "@utils/displayDate";

const salesmenAliases: Record<string, string> = {
  "Ho Yeung Cheung": "Alex",
  "Hung Ki So": "Dominic",
  "Kwok Wai Mak": "Matthew",
};
const salesmanLabel = (name: string) => salesmenAliases[name] || name;
const compareVisits = (a: ReportEntry, b: ReportEntry) =>
  b.date.localeCompare(a.date) || b.time_range.localeCompare(a.time_range);

function ClientVisit({
  entry,
  latest = false,
}: {
  entry: ReportEntry;
  latest?: boolean;
}) {
  const details = [
    ["Orders", entry.orders],
    ["Samples", entry.samples],
    ["Telephone orders", entry.tel_orders],
    ["Product introduction", entry.new_product_intro],
    ["Follow-up", entry.old_product_followup],
    ["Delivery update", entry.delivery_time_update],
  ].filter(([, value]) => value);

  return (
    <div className="client-visit">
      <div className="client-visit-meta">
        {latest && <p className="people-caption">Latest visit</p>}
        <time dateTime={entry.date}>{formatDisplayDate(entry.date)}</time>
        {entry.time_range && <span>{entry.time_range}</span>}
        <span>{salesmanLabel(entry.salesman_name)}</span>
        {!latest && (
          <span>
            {entry.client_type === "doctor" ? "Doctor" : "Nurse"} ·{" "}
            {entry.district}
          </span>
        )}
      </div>
      {details.length ? (
        <dl className="client-visit-details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="people-caption">No visit notes were recorded.</p>
      )}
    </div>
  );
}

function ClientRecord({
  name,
  visits,
}: {
  name: string;
  visits: ReportEntry[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [historyMounted, setHistoryMounted] = useState(false);
  const historyId = useId();
  const latest = visits[0];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <li className="client-record">
      <header className="client-record-heading">
        <div className="client-identity">
          <span className="client-avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <h2>{name}</h2>
            <p className="client-location">
              <MapPin size={13} aria-hidden="true" />
              {latest.district || "District not recorded"}
              <span aria-hidden="true">·</span>
              {latest.client_type === "doctor" ? "Doctor" : "Nurse"}
            </p>
          </div>
        </div>
        <span className="client-visit-count">
          {visits.length} {visits.length === 1 ? "visit" : "visits"}
        </span>
      </header>
      <ClientVisit entry={latest} latest />
      {visits.length > 1 && (
        <>
          <button
            type="button"
            className="client-history-toggle"
            aria-label={`${expanded ? "Hide" : "Show"} earlier visits for ${name}`}
            aria-expanded={expanded}
            aria-controls={historyId}
            onClick={() => {
              setHistoryMounted(true);
              setExpanded((open) => !open);
            }}
          >
            <ChevronDown size={16} aria-hidden="true" />
            {expanded
              ? "Hide earlier visits"
              : `Earlier visits (${visits.length - 1})`}
          </button>
          <div
            id={historyId}
            className="client-history-panel"
            data-open={expanded}
            aria-hidden={!expanded}
          >
            <div className="client-history-content" inert={!expanded}>
              {historyMounted &&
                visits
                  .slice(1)
                  .map((entry, index) => (
                    <ClientVisit key={entry.id || index} entry={entry} />
                  ))}
            </div>
          </div>
        </>
      )}
    </li>
  );
}

export default function Client() {
  const {
    data: entries = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetAllReportEntries();
  const { user } = useAuth();
  const isSalesman = user?.role === "SALESMAN";
  const userFullname =
    `${user?.firstname || ""} ${user?.lastname || ""}`.trim();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSalesman, setSelectedSalesman] = useState("all");
  const clientsPerPage = 5;

  const salesmanList = useMemo(
    () =>
      Array.from(
        new Set(entries.map((entry) => entry.salesman_name).filter(Boolean)),
      ).sort((a, b) => salesmanLabel(a).localeCompare(salesmanLabel(b))),
    [entries],
  );

  const clients = useMemo(() => {
    const grouped = new Map<string, ReportEntry[]>();
    for (const entry of entries) {
      if (
        isSalesman
          ? entry.salesman_name !== userFullname
          : selectedSalesman !== "all" &&
            entry.salesman_name !== selectedSalesman
      )
        continue;
      const visits = grouped.get(entry.doctor_name) || [];
      visits.push(entry);
      grouped.set(entry.doctor_name, visits);
    }
    return Array.from(grouped, ([name, visits]) => ({
      name,
      visits: visits.sort(compareVisits),
    })).sort(
      (a, b) =>
        compareVisits(a.visits[0], b.visits[0]) || a.name.localeCompare(b.name),
    );
  }, [entries, isSalesman, userFullname, selectedSalesman]);

  const search = searchTerm.trim().toLocaleLowerCase();
  const filteredClients = clients.filter(
    ({ name, visits }) =>
      name.toLocaleLowerCase().includes(search) ||
      visits[0].district.toLocaleLowerCase().includes(search),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / clientsPerPage),
  );
  const page = Math.min(currentPage, totalPages);
  const firstIndex = (page - 1) * clientsPerPage;
  const currentClients = filteredClients.slice(
    firstIndex,
    firstIndex + clientsPerPage,
  );
  const filtersActive = Boolean(searchTerm || selectedSalesman !== "all");
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSalesman("all");
    setCurrentPage(1);
  };
  const firstPageNumber = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPageNumber + index,
  );

  return (
    <div className="page-stack clients-page">
      <PageHeader
        eyebrow="YOUR CONNECTIONS"
        title="Clients"
        description="Find a client, review recent visits and pick up where you left off."
      />
      <section
        className="people-panel clients-panel"
        aria-label="Client directory"
      >
        <div className="client-toolbar">
          <div className="people-field client-search-field">
            <label htmlFor="client-search">Search clients</label>
            <div className="client-search">
              <Search size={18} aria-hidden="true" />
              <input
                id="client-search"
                type="search"
                placeholder="Name or district"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Clear client search"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                    document.getElementById("client-search")?.focus();
                  }}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {!isSalesman && (
            <div className="people-field client-salesperson-field">
              <label htmlFor="client-salesperson">Salesperson</label>
              <select
                id="client-salesperson"
                aria-label="Filter by salesman"
                value={selectedSalesman}
                onChange={(event) => {
                  setSelectedSalesman(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All salespeople</option>
                {salesmanList.map((name) => (
                  <option key={name} value={name}>
                    {salesmanLabel(name)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading clients…" />
        ) : isError && !entries.length ? (
          <div className="people-empty" role="alert">
            <UsersRound size={28} aria-hidden="true" />
            <h2>Clients couldn’t be loaded</h2>
            <p>Please try again.</p>
            <button
              className="button button-quiet"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {isError && (
              <div className="people-inline-message" role="alert">
                The latest clients couldn’t be loaded. Showing your previous
                results.
                <button
                  className="button button-quiet"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  Try again
                </button>
              </div>
            )}
            <div className="client-results-bar">
              <p aria-live="polite" aria-atomic="true">
                {filteredClients.length
                  ? `Showing ${firstIndex + 1}–${Math.min(firstIndex + clientsPerPage, filteredClients.length)} of ${filteredClients.length} clients`
                  : "0 clients"}
              </p>
              <span>
                {isFetching ? (
                  <span role="status">Updating clients…</span>
                ) : (
                  "Latest visit first"
                )}
              </span>
            </div>
            {!currentClients.length ? (
              <div className="people-empty">
                <UsersRound size={28} aria-hidden="true" />
                <h2>
                  {filtersActive ? "No matching clients" : "No clients yet"}
                </h2>
                <p>
                  {filtersActive
                    ? "Try another name, district or salesperson."
                    : "Clients appear here after their first report entry."}
                </p>
                {filtersActive && (
                  <button
                    className="button button-quiet"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="client-records">
                {currentClients.map(({ name, visits }) => (
                  <ClientRecord key={name} name={name} visits={visits} />
                ))}
              </ul>
            )}
            {totalPages > 1 && (
              <nav className="client-pagination" aria-label="Client pages">
                <button
                  className="icon-button client-page-edge"
                  aria-label="First page"
                  disabled={page === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  <ChevronsLeft size={18} aria-hidden="true" />
                </button>
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() => setCurrentPage(page - 1)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                {pageNumbers.map((number) => (
                  <button
                    key={number}
                    className="client-page-number"
                    aria-label={`Page ${number}`}
                    aria-current={page === number ? "page" : undefined}
                    onClick={() => setCurrentPage(number)}
                  >
                    {number}
                  </button>
                ))}
                <span className="client-page-label">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={page === totalPages}
                  onClick={() => setCurrentPage(page + 1)}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
                <button
                  className="icon-button client-page-edge"
                  aria-label="Last page"
                  disabled={page === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  <ChevronsRight size={18} aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
