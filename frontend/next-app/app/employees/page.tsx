"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserCheck, UserX } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MANAGEMENT_ROLES, type EmployeeProfile } from "@/lib/types";
import { Badge, EmptyState, ErrorPanel, LoadingPanel, PageHeader } from "@/components/ui";

export default function EmployeesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const employees = useQuery({
    queryKey: ["employees"],
    queryFn: () => api<EmployeeProfile[]>("employees/all/"),
    enabled: !!user && MANAGEMENT_ROLES.includes(user.role),
  });

  const toggle = useMutation({
    mutationFn: (id: number) =>
      api<{ is_active: boolean }>(`profile/${id}/toggle-status/`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["employees"] });
      const previous = queryClient.getQueryData<EmployeeProfile[]>(["employees"]);
      queryClient.setQueryData<EmployeeProfile[]>(["employees"], (current = []) =>
        current.map((employee) =>
          employee.id === id
            ? { ...employee, is_active: !employee.is_active }
            : employee,
        ),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["employees"], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return employees.data || [];
    return (employees.data || []).filter((employee) =>
      [
        employee.user.username,
        employee.user.first_name,
        employee.user.last_name,
        employee.user.email,
        employee.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [employees.data, search]);

  if (!user || !MANAGEMENT_ROLES.includes(user.role)) {
    return <ErrorPanel message="Only administrators, directors and CEOs can manage employees." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee profiles and account access."
      />

      <div className="surface p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a929c]" size={17} />
          <input
            className="soft-input !pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees…"
          />
        </div>
      </div>

      {employees.isLoading ? (
        <LoadingPanel rows={6} />
      ) : employees.error ? (
        <ErrorPanel message="Unable to load employees." />
      ) : !filtered.length ? (
        <EmptyState title="No employees found" />
      ) : (
        <div className="surface overflow-hidden">
          <div className="divide-y divide-[#edf0f2]">
            {filtered.map((employee) => (
              <div
                key={employee.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
              >
                <Link href={`/employees/${employee.id}`} className="min-w-0 flex-1">
                  <div className="font-medium text-[#25292e]">
                    {employee.user.first_name} {employee.user.last_name}
                  </div>
                  <div className="mt-0.5 text-sm text-[#7a828c]">
                    @{employee.user.username} · {employee.user.email || "No email"}
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge>{employee.role}</Badge>
                  <Badge tone={employee.is_active ? "success" : "danger"}>
                    {employee.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <button
                    className={employee.is_active ? "btn-danger !py-2" : "btn-secondary !py-2"}
                    disabled={toggle.isPending}
                    onClick={() => toggle.mutate(employee.id)}
                  >
                    {employee.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                    {employee.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
