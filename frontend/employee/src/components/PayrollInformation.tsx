import { useEffect, useRef, useState } from "react";
import type {
  EmployeeProfile,
  PayrollInformationProps,
  SalaryData,
} from "@interfaces/index";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Check, LoaderCircle, Pencil } from "lucide-react";
import { useAuth } from "@context/AuthContext";
import { backendUrl } from "@configs/DotEnv";
import { formatAmount } from "@utils/formatAmount";

const fields = [
  ["Base salary", "baseSalary"],
  ["Bonus payment", "bonusPayment"],
  ["Year end bonus", "yearEndBonus"],
  ["Transportation allowance", "transportationAllowance"],
] as const;
type EditableField = (typeof fields)[number][1];
const draftFrom = (salary: SalaryData): Record<EditableField, string> => ({
  baseSalary: String(salary.baseSalary ?? 0),
  bonusPayment: String(salary.bonusPayment ?? 0),
  yearEndBonus: String(salary.yearEndBonus ?? 0),
  transportationAllowance: String(salary.transportationAllowance ?? 0),
});

export default function PayrollInformation({
  salaryData,
  grossPayment,
  netPayment,
  mpfDeductionAmount,
  year,
  month,
  userRole,
  employeeId,
}: PayrollInformationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => draftFrom(salaryData));
  const [saved, setSaved] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: {
      base_salary: number;
      bonus_payment: number;
      year_end_bonus: number;
      transportation_allowance: number;
      commission?: number;
    }) => {
      const response = await axios.patch<EmployeeProfile>(
        `${backendUrl}/api/profile/${employeeId}/update/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    },
    onSuccess: async (profile) => {
      await queryClient.cancelQueries({ queryKey: ["employee-salaries"] });
      if (profile.id === employeeId) {
        queryClient.setQueriesData<EmployeeProfile[]>(
          { queryKey: ["employee-salaries"] },
          (previous) =>
            previous?.map((entry) =>
              entry.id === employeeId ? { ...entry, ...profile } : entry,
            ),
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      void queryClient.invalidateQueries({ queryKey: ["all-employees"] });
      void queryClient.invalidateQueries({
        queryKey: ["employee", String(employeeId)],
      });
      setSaved(true);
      restoreFocus.current = true;
      setIsEditing(false);
    },
  });
  useEffect(() => {
    if (!isEditing && restoreFocus.current) {
      if (!editButton.current?.closest("[inert], [hidden]"))
        editButton.current?.focus();
      restoreFocus.current = false;
    }
  }, [isEditing]);

  const beginEdit = () => {
    setDraft(draftFrom(salaryData));
    setSaved(false);
    mutation.reset();
    setIsEditing(true);
  };
  const cancel = () => {
    mutation.reset();
    restoreFocus.current = true;
    setIsEditing(false);
  };
  const payload = {
    base_salary: Number(draft.baseSalary || 0),
    bonus_payment: Number(draft.bonusPayment || 0),
    year_end_bonus: Number(draft.yearEndBonus || 0),
    transportation_allowance: Number(draft.transportationAllowance || 0),
    ...(userRole === "SALESMAN" && { commission: salaryData.commission || 0 }),
  };
  const previewGross =
    payload.base_salary +
    payload.bonus_payment +
    payload.year_end_bonus +
    payload.transportation_allowance +
    (salaryData.commission || 0);
  const previewDeduction = Math.min(
    1500,
    previewGross * (salaryData.mpfDeduction || 0),
  );
  const gross = isEditing ? previewGross : grossPayment;
  const deduction = isEditing ? previewDeduction : mpfDeductionAmount;
  const net = isEditing ? previewGross - previewDeduction : netPayment;

  return (
    <form
      className="payroll-information"
      onSubmit={(event) => {
        event.preventDefault();
        if (isEditing && !mutation.isPending) mutation.mutate(payload);
      }}
    >
      <header className="finance-section-heading">
        <div>
          <h3>Pay breakdown</h3>
          <p className="finance-caption">
            {new Date(year, month - 1).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {!isEditing && employeeId !== undefined && (
          <button
            type="button"
            ref={editButton}
            className="button button-quiet"
            onClick={beginEdit}
            aria-label="Edit payroll information"
          >
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
        )}
        {isEditing && <span className="finance-caption">Editing</span>}
      </header>
      <div className="payroll-info-columns">
        <section className="payroll-earnings" aria-label="Salary components">
          {isEditing ? (
            <div className="payroll-edit-fields">
              {fields.map(([label, field]) => (
                <div className="workspace-field" key={field}>
                  <label htmlFor={`payroll-${employeeId}-${field}`}>
                    {label}
                  </label>
                  <div className="workspace-money">
                    <span aria-hidden="true">$</span>
                    <input
                      id={`payroll-${employeeId}-${field}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      className="workspace-input"
                      value={draft[field]}
                      disabled={mutation.isPending}
                      onChange={(event) =>
                        setDraft((previous) => ({
                          ...previous,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <dl className="payroll-amount-list">
              {fields.map(([label, field]) => (
                <div key={field}>
                  <dt>{label}</dt>
                  <dd>{formatAmount(salaryData[field] || 0)}</dd>
                </div>
              ))}
            </dl>
          )}
          {userRole === "SALESMAN" && (
            <dl className="payroll-amount-list payroll-commission">
              <div>
                <dt>Commission</dt>
                <dd>{formatAmount(salaryData.commission || 0)}</dd>
              </div>
            </dl>
          )}
        </section>
        <section
          className="payroll-payment-summary"
          aria-label="Payment summary"
        >
          <p className="finance-caption">
            {isEditing ? "Preview while editing" : "Payment summary"}
          </p>
          <dl className="payroll-amount-list">
            <div>
              <dt>Gross pay</dt>
              <dd>{formatAmount(gross)}</dd>
            </div>
            <div>
              <dt>MPF deduction</dt>
              <dd>−{formatAmount(deduction)}</dd>
            </div>
            <div className="payroll-net">
              <dt>Net pay</dt>
              <dd>{formatAmount(net)}</dd>
            </div>
          </dl>
        </section>
      </div>
      {mutation.isError && (
        <p className="payroll-save-error" role="alert">
          Changes couldn’t be saved. Your edits are still here. Try saving
          again.
        </p>
      )}
      {saved && (
        <p className="payroll-saved" role="status">
          <Check size={16} aria-hidden="true" />
          Changes saved
        </p>
      )}
      {isEditing && (
        <footer className="payroll-edit-actions">
          <button
            type="submit"
            className="button button-primary payroll-save"
            aria-label="Save changes"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <LoaderCircle
                size={16}
                className="finance-working-icon"
                aria-hidden="true"
              />
            ) : (
              <Check size={16} aria-hidden="true" />
            )}
            Save
          </button>
          <button
            type="button"
            className="button button-quiet"
            disabled={mutation.isPending}
            onClick={cancel}
          >
            Cancel
          </button>
          {mutation.isPending && (
            <span className="finance-caption" role="status">
              Saving changes…
            </span>
          )}
        </footer>
      )}
    </form>
  );
}
