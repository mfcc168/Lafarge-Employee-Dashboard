"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SALES_ROLES, type ClientSummary } from "@/lib/types";
import { EmptyState, ErrorPanel, LoadingPanel, PageHeader } from "@/components/ui";

export default function ClientPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const clients = useQuery({
    queryKey: ["client-directory", query],
    queryFn: () =>
      api<ClientSummary[]>(
        `client-directory/${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      ),
    enabled: !!user && SALES_ROLES.includes(user.role),
  });

  if (!user || !SALES_ROLES.includes(user.role)) {
    return <ErrorPanel message="You do not have permission to view the client directory." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client directory"
        description="Search clients without downloading the full report history."
      />

      <div className="surface p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a929c]" size={17} />
          <input
            className="soft-input !pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search client or district…"
          />
        </div>
      </div>

      {clients.isLoading ? (
        <LoadingPanel rows={6} />
      ) : clients.error ? (
        <ErrorPanel message="Unable to load clients." />
      ) : !clients.data?.length ? (
        <EmptyState title="No clients found" />
      ) : (
        <div className="surface overflow-hidden">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_100px_130px] gap-4 border-b border-[#e9ecef] bg-[#fafbfb] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#7b838d] md:grid">
            <div>Client</div>
            <div>District</div>
            <div>Salesperson</div>
            <div>Visits</div>
            <div>Last visit</div>
          </div>
          <div className="divide-y divide-[#edf0f2]">
            {clients.data.map((client, index) => (
              <div
                key={`${client.doctor_name}-${client.salesman_name}-${index}`}
                className="grid gap-2 px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_100px_130px] md:items-center md:gap-4"
              >
                <div>
                  <div className="font-medium text-[#262a2f]">{client.doctor_name || "Unnamed client"}</div>
                  <div className="text-xs capitalize text-[#8a929c]">{client.client_type}</div>
                </div>
                <div className="text-sm text-[#656d77]">{client.district || "—"}</div>
                <div className="text-sm text-[#656d77]">{client.salesman_name}</div>
                <div className="text-sm font-medium text-[#34383e]">{client.visits}</div>
                <div className="text-sm text-[#656d77]">{client.last_visit || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
