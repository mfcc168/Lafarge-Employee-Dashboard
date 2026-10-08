import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import type { EmployeeProfile } from "@interfaces/EmployeeType";
import LoadingSpinner from "@components/LoadingSpinner";
import {
  UserX,
  UserCheck,
  AlertCircle,
  Check,
  LoaderCircle,
  Users,
} from "lucide-react";
import SearchField from "@components/SearchField";
import { Link } from "react-router-dom";
import { canManageEmployees, PERMISSION_MESSAGES } from "@utils/permissions";
import {
  employeeInitials,
  employeeName,
  employeeRole,
} from "@utils/employeeDisplay";
import { updateEmployeeCaches } from "@utils/employeeCache";

type StatusFilter = "all" | "active" | "inactive";

function EmployeeRow({
  employee,
  canViewProfile,
  onStatusChange,
}: {
  employee: EmployeeProfile;
  canViewProfile: boolean;
  onStatusChange: (
    message: string,
    active: boolean,
    restoreFocus: boolean,
  ) => void;
}) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const row = useRef<HTMLLIElement>(null);
  const pending = useRef(false);
  const hadFocus = useRef(false);
  const name = employeeName(employee);
  const mutation = useMutation({
    retry: false,
    mutationFn: async () => {
      const response = await axios.post<{ is_active: boolean }>(
        `${backendUrl}/api/profile/${employee.id}/toggle-status/`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return response.data;
    },
    onSuccess: async (response) => {
      const restoreFocus =
        !!row.current?.contains(document.activeElement) ||
        (hadFocus.current && document.activeElement === document.body);
      onStatusChange(
        `${name} ${response.is_active ? "activated" : "deactivated"}.`,
        response.is_active,
        restoreFocus,
      );
      await updateEmployeeCaches(queryClient, accessToken, employee.id, {
        is_active: response.is_active,
      });
    },
    onSettled: () => {
      pending.current = false;
    },
  });

  return (
    <li className="employee-row" ref={row}>
      <div className="employee-identity">
        <span className="employee-avatar" aria-hidden="true">
          {employeeInitials(employee)}
        </span>
        <div className="employee-identity-text">
          {canViewProfile ? (
            <Link
              className="employee-name-link"
              to={`/employees/${employee.id}`}
            >
              <span>{name}</span>
              <span className="employee-profile-hint">View profile</span>
            </Link>
          ) : (
            <h3>{name}</h3>
          )}
          <div className="employee-contact">
            <p className="employee-meta">@{employee.user.username}</p>
            {employee.user.email && (
              <p className="employee-email">{employee.user.email}</p>
            )}
          </div>
        </div>
      </div>
      <span className="employee-role">
        <span className="employee-mobile-label">Role</span>
        {employeeRole(employee.role)}
      </span>
      <span
        className={`employee-status ${employee.is_active ? "is-active" : "is-inactive"}`}
      >
        <span aria-hidden="true" />
        {employee.is_active ? "Active" : "Inactive"}
      </span>
      <div className="employee-row-actions">
        <button
          type="button"
          className="button button-quiet employee-status-action"
          disabled={mutation.isPending}
          aria-label={`${employee.is_active ? "Deactivate" : "Activate"} ${name}`}
          onClick={() => {
            if (pending.current) return;
            hadFocus.current = !!row.current?.contains(document.activeElement);
            pending.current = true;
            mutation.mutate();
          }}
        >
          {mutation.isPending ? (
            <LoaderCircle
              size={16}
              className="employee-working-icon"
              aria-hidden="true"
            />
          ) : employee.is_active ? (
            <UserX size={16} aria-hidden="true" />
          ) : (
            <UserCheck size={16} aria-hidden="true" />
          )}
          {mutation.isPending
            ? "Updating…"
            : employee.is_active
              ? "Deactivate"
              : "Activate"}
        </button>
        <span className="sr-only" role="status">
          {mutation.isPending ? `Updating account access for ${name}…` : ""}
        </span>
      </div>
      {mutation.isError && (
        <p className="employee-row-error" role="alert">
          {name} couldn’t be {employee.is_active ? "deactivated" : "activated"}.
          Try again using the button above.
        </p>
      )}
    </li>
  );
}

export default function EmployeeManagement() {
  const { user, accessToken } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [message, setMessage] = useState("");
  const filterButtons = useRef<
    Partial<Record<StatusFilter, HTMLButtonElement | null>>
  >({});
  const {
    data: employees,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<EmployeeProfile[]>({
    queryKey: ["all-employees", accessToken],
    queryFn: async ({ signal }) => {
      const response = await axios.get<EmployeeProfile[]>(
        `${backendUrl}/api/employees/all/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
        },
      );
      return response.data;
    },
    enabled: !!user && canManageEmployees(user.role) && !!accessToken,
  });
  if (!user || !canManageEmployees(user.role))
    return (
      <div className="people-panel people-empty">
        <AlertCircle size={24} aria-hidden="true" />
        <h2>Access denied</h2>
        <p>{PERMISSION_MESSAGES.manageEmployees}</p>
      </div>
    );
  if (isLoading)
    return (
      <div className="people-panel employee-panel">
        <LoadingSpinner message="Loading employees…" />
      </div>
    );
  if (!employees)
    return (
      <div className="people-panel people-empty" role="alert">
        <AlertCircle size={24} aria-hidden="true" />
        <h2>Employees couldn’t be loaded</h2>
        <p>Try again to load your team directory.</p>
        <button type="button" className="button" onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  const directory = employees.filter(
    (entry) => !["ADMIN", "CEO", "DIRECTOR"].includes(entry.role),
  );
  const activeCount = directory.filter((entry) => entry.is_active).length;
  const filters: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: directory.length },
    { value: "active", label: "Active", count: activeCount },
    {
      value: "inactive",
      label: "Inactive",
      count: directory.length - activeCount,
    },
  ];
  const term = search.trim().toLocaleLowerCase();
  const visible = directory.filter(
    (entry) =>
      (status === "all" || entry.is_active === (status === "active")) &&
      `${employeeName(entry)} ${entry.user.username} ${entry.user.email} ${employeeRole(entry.role)}`
        .toLocaleLowerCase()
        .includes(term),
  );
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    filterButtons.current.all?.focus();
  };

  return (
    <section
      className="people-panel employee-panel"
      aria-labelledby="employee-directory-title"
    >
      <div className="employee-directory-heading">
        <div>
          <h2 id="employee-directory-title">Team directory</h2>
          <p>Manage employee profiles and account access.</p>
        </div>
        <span className="employee-refresh" role="status">
          {isFetching ? "Updating directory…" : ""}
        </span>
      </div>
      <div className="employee-directory-toolbar">
        <div
          className="people-filter-tabs employee-filters"
          role="group"
          aria-label="Filter employees by status"
        >
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              type="button"
              ref={(element) => {
                filterButtons.current[value] = element;
              }}
              aria-pressed={status === value}
              aria-controls="employee-directory-list"
              onClick={() => setStatus(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <SearchField
          id="employee-search"
          label="Search employees"
          placeholder="Name, username, email or role"
          value={search}
          onValueChange={setSearch}
          clearLabel="Clear employee search"
          className="employee-search-field"
        />
      </div>
      {error && (
        <div className="people-inline-message" role="alert">
          <span>
            Couldn’t refresh employees. Showing your previous results.
          </span>
          <button
            type="button"
            className="button button-quiet"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      )}
      <div className="employee-results-bar">
        <p role="status">
          Showing {visible.length} of {directory.length}{" "}
          {directory.length === 1 ? "employee" : "employees"}
        </p>
        {(term || status !== "all") && (
          <button
            type="button"
            className="button button-quiet"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="employee-list-heading" aria-hidden="true">
        <span>Employee</span>
        <span>Role</span>
        <span>Account</span>
        <span>Manage access</span>
      </div>
      <ul className="employee-list" id="employee-directory-list">
        {visible.map((entry) => (
          <EmployeeRow
            key={entry.id}
            employee={entry}
            canViewProfile={["ADMIN", "DIRECTOR"].includes(user.role || "")}
            onStatusChange={(nextMessage, active, restoreFocus) => {
              if (
                restoreFocus &&
                status !== "all" &&
                active !== (status === "active")
              )
                filterButtons.current[status]?.focus();
              setMessage(nextMessage);
            }}
          />
        ))}
      </ul>
      {!visible.length && (
        <div className="people-empty">
          <Users size={24} aria-hidden="true" />
          <h3>
            {directory.length ? "No matching employees" : "No employees yet"}
          </h3>
          <p>
            {directory.length
              ? "Try another search or clear your filters."
              : "Employee profiles will appear here when they’re added."}
          </p>
          {!!directory.length && (
            <button type="button" className="button" onClick={clearFilters}>
              Show all employees
            </button>
          )}
        </div>
      )}
      <footer className="employee-directory-footer">
        <details className="usage-note">
          <summary>About employee access</summary>
          <p>
            Deactivating an employee prevents sign-in and hides their reports
            and payroll. You can reactivate them at any time.
          </p>
        </details>
        <p className="employee-feedback" role="status" aria-live="polite">
          {message && (
            <>
              <Check size={15} aria-hidden="true" />
              {message}
            </>
          )}
        </p>
      </footer>
    </section>
  );
}
