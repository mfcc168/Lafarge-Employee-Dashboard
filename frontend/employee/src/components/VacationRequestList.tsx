import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, Check, Loader2, X } from "lucide-react";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import { useToast } from "@context/ToastContext";
import type { VacationRequest } from "@interfaces/index";
import { LazyVacationRequestForm as VacationRequestForm } from "@components/LazyComponents";
import MyVacationRequestList from "@components/MyVacationRequestList";
import VacationRequestCard from "@components/VacationRequestCard";
import LoadingSpinner from "@components/LoadingSpinner";
import { ALL_MANAGEMENT, hasRole } from "@utils/permissions";

export default function VacationRequestList() {
  const { accessToken, user, refreshUser } = useAuth();
  const { showSuccess } = useToast();
  const queryClient = useQueryClient();
  const isManagement = hasRole(user?.role, ALL_MANAGEMENT);
  const [activeTab, setActiveTab] = useState<
    "pending" | "history" | "myRequests"
  >("pending");
  const pendingTabRef = useRef<HTMLButtonElement>(null);

  const {
    data: requests = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["vacationRequests"],
    queryFn: async ({ signal }) => {
      const response = await axios.get<VacationRequest[]>(
        `${backendUrl}/api/vacations/`,
        {
          signal,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return response.data;
    },
    enabled: !!accessToken && isManagement,
  });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "approved" | "rejected";
    }) => {
      const response = await axios.patch<VacationRequest>(
        `${backendUrl}/api/vacation/${id}/update/`,
        { status },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return response.data;
    },
    onSuccess: (updatedRequest) => {
      const focusedCard = document.activeElement?.closest(
        ".vacation-request-card",
      );
      if (
        focusedCard?.getAttribute("aria-labelledby") ===
        `vacation-request-${updatedRequest.id}`
      )
        pendingTabRef.current?.focus();
      queryClient.setQueriesData<VacationRequest[]>(
        { queryKey: ["vacationRequests"] },
        (old) =>
          old?.map((request) =>
            request.id === updatedRequest.id ? updatedRequest : request,
          ),
      );
      if (updatedRequest.employee === user?.username) void refreshUser();
      showSuccess(
        `Request ${updatedRequest.status}`,
        `${updatedRequest.employee}’s request has been ${updatedRequest.status}.`,
      );
    },
  });

  const pending = requests.filter(
    (request) =>
      request.status === "pending" &&
      (isManagement || request.employee === user?.username),
  );
  const history = requests.filter(
    (request) =>
      (request.status === "approved" || request.status === "rejected") &&
      (isManagement || request.employee === user?.username),
  );
  const filteredRequests = [
    ...(activeTab === "pending" ? pending : history),
  ].sort((a, b) => b.id - a.id);

  return (
    <div className="vacation-management">
      <section
        className="people-panel vacation-requests-panel"
        aria-labelledby="team-vacation-requests-title"
      >
        <header className="people-section-heading">
          <div>
            <h2 id="team-vacation-requests-title">Vacation requests</h2>
            <p>Review team requests or manage your own time off.</p>
          </div>
          <div
            className="people-filter-tabs"
            role="group"
            aria-label="Filter vacation requests"
          >
            <button
              ref={pendingTabRef}
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
            {user && (
              <button
                type="button"
                aria-pressed={activeTab === "myRequests"}
                onClick={() => setActiveTab("myRequests")}
              >
                My time off
              </button>
            )}
          </div>
        </header>
        {activeTab !== "myRequests" && isError && requests.length > 0 && (
          <div className="people-inline-message" role="alert">
            The latest requests couldn’t be loaded. Showing your previous
            results.
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
        {activeTab !== "myRequests" &&
          (isLoading ? (
            <LoadingSpinner message="Loading team requests…" />
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
              {filteredRequests.map((request) => {
                const updating =
                  mutation.isPending && mutation.variables?.id === request.id;
                const failed =
                  mutation.isError && mutation.variables?.id === request.id;
                return (
                  <VacationRequestCard
                    key={request.id}
                    request={request}
                    showEmployee
                    busy={updating}
                    actions={
                      request.status === "pending" && isManagement ? (
                        <>
                          {failed && (
                            <p className="vacation-action-error" role="alert">
                              This request couldn’t be updated. Please try
                              again.
                            </p>
                          )}
                          <button
                            type="button"
                            className="button button-primary"
                            disabled={mutation.isPending}
                            aria-label={`Approve request from ${request.employee}`}
                            onClick={() => {
                              if (!mutation.isPending)
                                mutation.mutate({
                                  id: request.id,
                                  status: "approved",
                                });
                            }}
                          >
                            {updating &&
                            mutation.variables?.status === "approved" ? (
                              <>
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                                Approving…
                              </>
                            ) : (
                              <>
                                <Check size={16} aria-hidden="true" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="button button-quiet"
                            disabled={mutation.isPending}
                            aria-label={`Reject request from ${request.employee}`}
                            onClick={() => {
                              if (!mutation.isPending)
                                mutation.mutate({
                                  id: request.id,
                                  status: "rejected",
                                });
                            }}
                          >
                            {updating &&
                            mutation.variables?.status === "rejected" ? (
                              <>
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                                Rejecting…
                              </>
                            ) : (
                              <>
                                <X size={16} aria-hidden="true" />
                                Reject
                              </>
                            )}
                          </button>
                        </>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="people-empty">
              <CalendarDays size={28} aria-hidden="true" />
              <h3>
                {activeTab === "pending"
                  ? "All caught up"
                  : "No request history yet"}
              </h3>
              <p>
                {activeTab === "pending"
                  ? "There are no requests waiting for a decision."
                  : "Approved and rejected requests will appear here."}
              </p>
            </div>
          ))}
      </section>
      {activeTab === "myRequests" && (
        <>
          <VacationRequestForm />
          <MyVacationRequestList />
        </>
      )}
    </div>
  );
}
