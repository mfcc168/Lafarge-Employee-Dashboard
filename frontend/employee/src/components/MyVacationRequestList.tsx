import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays } from "lucide-react";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import type { VacationRequest } from "@interfaces/index";
import LoadingSpinner from "@components/LoadingSpinner";
import VacationRequestCard from "@components/VacationRequestCard";

export default function MyVacationRequestList() {
  const { user, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const {
    data: requests = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["vacationRequests", user?.username],
    queryFn: async ({ signal }) => {
      const response = await axios.get<VacationRequest[]>(
        `${backendUrl}/api/vacations/me/`,
        {
          signal,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return response.data;
    },
    enabled: !!accessToken && !!user?.username,
  });
  const pending = requests.filter((request) => request.status === "pending");
  const history = requests.filter(
    (request) => request.status === "approved" || request.status === "rejected",
  );
  const filteredRequests = [
    ...(activeTab === "pending" ? pending : history),
  ].sort((a, b) => b.id - a.id);

  return (
    <section
      className="people-panel vacation-requests-panel"
      aria-labelledby="my-vacation-requests-title"
    >
      <header className="people-section-heading">
        <div>
          <h2 id="my-vacation-requests-title">My requests</h2>
          <p>Track your upcoming time off and past decisions.</p>
        </div>
        <div
          className="people-filter-tabs"
          role="group"
          aria-label="Filter my vacation requests"
        >
          <button
            type="button"
            aria-pressed={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
          >
            Pending<span>{pending.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          >
            History<span>{history.length}</span>
          </button>
        </div>
      </header>
      {isError && requests.length > 0 && (
        <div className="people-inline-message" role="alert">
          The latest requests couldn’t be loaded. Showing your previous results.
          <button
            type="button"
            className="button button-quiet"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      )}
      {isLoading ? (
        <LoadingSpinner message="Loading your requests…" />
      ) : isError && !requests.length ? (
        <div className="people-empty" role="alert">
          <CalendarDays size={28} aria-hidden="true" />
          <h3>Requests couldn’t be loaded</h3>
          <p>Please try again.</p>
          <button
            type="button"
            className="button button-quiet"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      ) : filteredRequests.length ? (
        <div className="vacation-request-grid">
          {filteredRequests.map((request) => (
            <VacationRequestCard key={request.id} request={request} />
          ))}
        </div>
      ) : (
        <div className="people-empty">
          <CalendarDays size={28} aria-hidden="true" />
          <h3>
            {activeTab === "pending"
              ? "No pending requests"
              : "No request history yet"}
          </h3>
          <p>
            {activeTab === "pending"
              ? "Your requests will appear here while awaiting approval."
              : "Approved and rejected requests will appear here."}
          </p>
        </div>
      )}
    </section>
  );
}
