import PageHeader from "@components/PageHeader";
import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { backendUrl } from "@configs/DotEnv";
import { useAuth } from "@context/AuthContext";
import type { EmployeeProfile } from "@interfaces/EmployeeType";
import LoadingSpinner from "@components/LoadingSpinner";
import {
  ArrowLeft,
  Check,
  Pencil,
  ChevronDown,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import {
  employeeInitials,
  employeeName,
  employeeRole,
  employmentDate,
} from "@utils/employeeDisplay";
import { updateEmployeeCaches } from "@utils/employeeCache";
import { formatAmount } from "@utils/formatAmount";

const amountFields = [
  ["Base salary", "base_salary"],
  ["Transportation allowance", "transportation_allowance"],
  ["Bonus payment", "bonus_payment"],
  ["Year end bonus", "year_end_bonus"],
] as const;

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EmployeeProfile>>({});
  const [saved, setSaved] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const firstField = useRef<HTMLSelectElement>(null);
  const restoreFocus = useRef(false);
  const pending = useRef(false);
  const hasPermission = ["ADMIN", "DIRECTOR"].includes(user?.role || "");
  const {
    data: employee,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<EmployeeProfile>({
    queryKey: ["employee", id],
    queryFn: async ({ signal }) => {
      const response = await axios.get<EmployeeProfile>(
        `${backendUrl}/api/profile/${id}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal,
        },
      );
      return response.data;
    },
    enabled: !!id && !!accessToken && hasPermission,
  });
  const mutation = useMutation({
    mutationFn: async (data: Partial<EmployeeProfile>) => {
      const response = await axios.patch<EmployeeProfile>(
        `${backendUrl}/api/profile/${id}/update/`,
        data,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      return response.data;
    },
    onSuccess: async (profile) => {
      await updateEmployeeCaches(queryClient, accessToken, profile.id, profile);
      setSaved(true);
      restoreFocus.current = true;
      setIsEditing(false);
    },
    onSettled: () => {
      pending.current = false;
    },
  });
  useEffect(() => {
    if (isEditing) firstField.current?.focus();
    else if (restoreFocus.current) {
      editButton.current?.focus();
      restoreFocus.current = false;
    }
  }, [isEditing]);
  const beginEdit = () => {
    if (!employee) return;
    // Read the latest server values only when editing starts; refreshes never replace a draft.
    setFormData({
      base_salary: employee.base_salary,
      transportation_allowance: employee.transportation_allowance,
      bonus_payment: employee.bonus_payment,
      year_end_bonus: employee.year_end_bonus,
      annual_leave_days: employee.annual_leave_days,
      is_mpf_exempt: employee.is_mpf_exempt,
      role: employee.role,
      employment_date: employee.employment_date || null,
    });
    setSaved(false);
    mutation.reset();
    setIsEditing(true);
  };
  const changeField = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    const updated =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : type === "date"
          ? value || null
          : value;
    setFormData((previous) => ({ ...previous, [name]: updated }));
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR TEAM"
        title="Employee details"
        description="Profile, compensation and employment settings."
        actions={
          <Link className="button" to="/employees">
            <ArrowLeft size={17} aria-hidden="true" />
            Employees
          </Link>
        }
      />
      {!hasPermission ? (
        <div className="people-panel people-empty">
          <AlertCircle size={24} aria-hidden="true" />
          <h2>Access denied</h2>
          <p>You do not have permission to access this page.</p>
          <Link className="button" to="/">
            Go to Home
          </Link>
        </div>
      ) : isLoading ? (
        <div className="people-panel employee-panel">
          <LoadingSpinner message="Loading employee profile…" />
        </div>
      ) : !employee ? (
        <div className="people-panel people-empty" role="alert">
          <AlertCircle size={24} aria-hidden="true" />
          <h2>Employee profile couldn’t be loaded</h2>
          <p>Try again to load these details.</p>
          <button
            type="button"
            className="button"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      ) : (
        <section
          className="people-panel employee-profile-panel"
          aria-labelledby="employee-profile-name"
        >
          <header className="employee-profile-header">
            <div className="employee-identity">
              <span
                className="employee-avatar employee-profile-avatar"
                aria-hidden="true"
              >
                {employeeInitials(employee)}
              </span>
              <div className="employee-identity-text">
                <h2 id="employee-profile-name">{employeeName(employee)}</h2>
                <p className="employee-meta">@{employee.user.username}</p>
                {employee.user.email && (
                  <p className="employee-email">{employee.user.email}</p>
                )}
              </div>
            </div>
            <div className="employee-profile-actions">
              <span
                className={`employee-status ${employee.is_active ? "is-active" : "is-inactive"}`}
              >
                <span aria-hidden="true" />
                {employee.is_active ? "Active" : "Inactive"}
              </span>
              {!isEditing && (
                <button
                  type="button"
                  ref={editButton}
                  className="button button-quiet"
                  onClick={beginEdit}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Edit profile
                </button>
              )}
              {isEditing && (
                <span className="employee-edit-label">Editing profile</span>
              )}
            </div>
          </header>
          {error && (
            <div className="people-inline-message" role="alert">
              <span>
                Couldn’t refresh this profile. Showing your previous details.
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!isEditing || pending.current || mutation.isPending) return;
              pending.current = true;
              mutation.mutate(formData);
            }}
          >
            <div className="employee-profile-sections">
              <section
                className="employee-profile-section"
                aria-labelledby="employee-employment-title"
              >
                <h3 id="employee-employment-title">Employment</h3>
                <p className="people-caption">
                  Role, start date and leave allowance.
                </p>
                {isEditing ? (
                  <fieldset
                    className="employee-edit-fields"
                    disabled={mutation.isPending}
                  >
                    <legend className="sr-only">Employment settings</legend>
                    <div className="workspace-field">
                      <label htmlFor="employee-role">Role</label>
                      <div className="workspace-select">
                        <select
                          id="employee-role"
                          name="role"
                          ref={firstField}
                          className="workspace-input"
                          value={formData.role || ""}
                          onChange={changeField}
                        >
                          {![
                            "SALESMAN",
                            "CLERK",
                            "DELIVERYMAN",
                            "MANAGER",
                          ].includes(formData.role || "") && (
                            <option value={formData.role}>
                              {employeeRole(formData.role || "")}
                            </option>
                          )}
                          <option value="SALESMAN">Salesman</option>
                          <option value="CLERK">Clerk</option>
                          <option value="DELIVERYMAN">Deliveryman</option>
                          <option value="MANAGER">Manager</option>
                        </select>
                        <ChevronDown size={17} aria-hidden="true" />
                      </div>
                    </div>
                    <div className="workspace-field">
                      <label htmlFor="employee-employment_date">
                        Employment date
                      </label>
                      <input
                        type="date"
                        id="employee-employment_date"
                        name="employment_date"
                        className="workspace-input"
                        value={formData.employment_date ?? ""}
                        onChange={changeField}
                      />
                    </div>
                    <div className="workspace-field">
                      <label htmlFor="employee-annual_leave_days">
                        Annual leave days
                      </label>
                      <input
                        type="number"
                        required
                        step="0.5"
                        inputMode="decimal"
                        id="employee-annual_leave_days"
                        name="annual_leave_days"
                        className="workspace-input"
                        value={formData.annual_leave_days ?? ""}
                        onChange={changeField}
                      />
                    </div>
                    <label className="employee-checkbox-field">
                      <input
                        type="checkbox"
                        name="is_mpf_exempt"
                        checked={formData.is_mpf_exempt ?? false}
                        onChange={changeField}
                      />
                      <span>MPF exempt</span>
                    </label>
                  </fieldset>
                ) : (
                  <dl className="employee-detail-list">
                    <div>
                      <dt>Role</dt>
                      <dd>{employeeRole(employee.role)}</dd>
                    </div>
                    <div>
                      <dt>Employment date</dt>
                      <dd>{employmentDate(employee.employment_date)}</dd>
                    </div>
                    <div>
                      <dt>Annual leave days</dt>
                      <dd>
                        {employee.annual_leave_days} <span>days</span>
                      </dd>
                    </div>
                    <div>
                      <dt>MPF exempt</dt>
                      <dd>{employee.is_mpf_exempt ? "Yes" : "No"}</dd>
                    </div>
                  </dl>
                )}
              </section>
              <section
                className="employee-profile-section"
                aria-labelledby="employee-compensation-title"
              >
                <h3 id="employee-compensation-title">Compensation</h3>
                <p className="people-caption">
                  Salary, allowances and bonus payments.
                </p>
                {isEditing ? (
                  <fieldset
                    className="employee-edit-fields"
                    disabled={mutation.isPending}
                  >
                    <legend className="sr-only">Compensation settings</legend>
                    {amountFields.map(([label, field]) => (
                      <div className="workspace-field" key={field}>
                        <label htmlFor={`employee-${field}`}>{label}</label>
                        <div className="workspace-money">
                          <span aria-hidden="true">$</span>
                          <input
                            type="number"
                            required
                            step="0.01"
                            inputMode="decimal"
                            id={`employee-${field}`}
                            name={field}
                            className="workspace-input"
                            value={formData[field] ?? ""}
                            onChange={changeField}
                          />
                        </div>
                      </div>
                    ))}
                  </fieldset>
                ) : (
                  <dl className="employee-detail-list employee-compensation-list">
                    {amountFields.map(([label, field]) => (
                      <div key={field}>
                        <dt>{label}</dt>
                        <dd>{formatAmount(Number(employee[field]))}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            </div>
            {mutation.isError && (
              <div className="people-inline-message" role="alert">
                <span>
                  Changes couldn’t be saved. Your edits are still here. Check
                  the fields and try again.
                </span>
              </div>
            )}
            {(isEditing || saved || isFetching) && (
              <footer className="employee-profile-footer">
                <p
                  className="employee-feedback"
                  role="status"
                  aria-live="polite"
                >
                  {mutation.isPending ? (
                    <>
                      <LoaderCircle
                        size={16}
                        className="employee-working-icon"
                        aria-hidden="true"
                      />
                      Saving changes…
                    </>
                  ) : saved ? (
                    <>
                      <Check size={16} aria-hidden="true" />
                      Changes saved
                    </>
                  ) : isEditing ? (
                    "Changes are saved when you click Save changes."
                  ) : isFetching ? (
                    "Updating profile…"
                  ) : (
                    ""
                  )}
                </p>
                {isEditing && (
                  <div className="employee-form-actions">
                    <button
                      type="button"
                      className="button button-quiet"
                      disabled={mutation.isPending}
                      onClick={() => {
                        if (pending.current) return;
                        mutation.reset();
                        restoreFocus.current = true;
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={mutation.isPending}
                    >
                      Save changes
                    </button>
                  </div>
                )}
              </footer>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
