"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MANAGEMENT_ROLES, type EmployeeProfile, type UserRole } from "@/lib/types";
import { ErrorPanel, LoadingPanel, PageHeader } from "@/components/ui";

type EditableEmployee = Pick<
  EmployeeProfile,
  | "role"
  | "base_salary"
  | "year_end_bonus"
  | "bonus_payment"
  | "transportation_allowance"
  | "annual_leave_days"
  | "is_mpf_exempt"
  | "employment_date"
>;

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EditableEmployee | null>(null);
  const [saved, setSaved] = useState(false);

  const employee = useQuery({
    queryKey: ["employee", id],
    queryFn: () => api<EmployeeProfile>(`profile/${id}/`),
    enabled: !!user && MANAGEMENT_ROLES.includes(user.role),
  });

  useEffect(() => {
    if (!employee.data) return;
    const value = employee.data;
    setForm({
      role: value.role,
      base_salary: value.base_salary,
      year_end_bonus: value.year_end_bonus,
      bonus_payment: value.bonus_payment,
      transportation_allowance: value.transportation_allowance,
      annual_leave_days: value.annual_leave_days,
      is_mpf_exempt: value.is_mpf_exempt,
      employment_date: value.employment_date || null,
    });
  }, [employee.data]);

  const update = useMutation({
    mutationFn: (data: EditableEmployee) =>
      api<EmployeeProfile>(`profile/${id}/update/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["employee", id], data);
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["payroll"] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
    },
  });

  if (!user || !MANAGEMENT_ROLES.includes(user.role)) {
    return <ErrorPanel message="You do not have permission to edit employee profiles." />;
  }
  if (employee.isLoading || !form) return <LoadingPanel rows={6} />;
  if (employee.error || !employee.data) return <ErrorPanel message="Unable to load employee." />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate(form);
  };

  const setField = <K extends keyof EditableEmployee>(
    key: K,
    value: EditableEmployee[K],
  ) => setForm((current) => current && { ...current, [key]: value });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.data.user.first_name} ${employee.data.user.last_name}`}
        description={`@${employee.data.user.username} · ${employee.data.user.email || "No email"}`}
        actions={
          <Link href="/employees" className="btn-secondary">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="surface max-w-4xl p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-sm font-medium text-[#555c65]">Role</span>
            <select
              className="soft-input"
              value={form.role}
              onChange={(event) => setField("role", event.target.value as UserRole)}
            >
              {["SALESMAN", "CLERK", "DELIVERYMAN", "MANAGER", "ADMIN", "DIRECTOR", "CEO"].map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </label>

          {[
            ["base_salary", "Base salary"],
            ["transportation_allowance", "Transportation allowance"],
            ["bonus_payment", "Bonus payment"],
            ["year_end_bonus", "Year-end bonus"],
          ].map(([key, label]) => (
            <label key={key}>
              <span className="mb-1.5 block text-sm font-medium text-[#555c65]">{label}</span>
              <input
                className="soft-input"
                type="number"
                step="0.01"
                value={String(form[key as keyof EditableEmployee] ?? "")}
                onChange={(event) =>
                  setField(key as keyof EditableEmployee, event.target.value as never)
                }
              />
            </label>
          ))}

          <label>
            <span className="mb-1.5 block text-sm font-medium text-[#555c65]">Annual leave days</span>
            <input
              className="soft-input"
              type="number"
              step="0.5"
              value={form.annual_leave_days}
              onChange={(event) => setField("annual_leave_days", Number(event.target.value))}
            />
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-medium text-[#555c65]">Employment date</span>
            <input
              className="soft-input"
              type="date"
              value={form.employment_date || ""}
              onChange={(event) => setField("employment_date", event.target.value || null)}
            />
          </label>

          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_mpf_exempt}
              onChange={(event) => setField("is_mpf_exempt", event.target.checked)}
            />
            <span className="text-sm font-medium text-[#555c65]">MPF exempt</span>
          </label>
        </div>

        {update.error && (
          <div className="mt-5">
            <ErrorPanel message={update.error instanceof Error ? update.error.message : "Update failed"} />
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button className="btn-primary" disabled={update.isPending}>
            <Save size={16} />
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm font-medium text-[#18794e]">Saved</span>}
        </div>
      </form>
    </div>
  );
}
