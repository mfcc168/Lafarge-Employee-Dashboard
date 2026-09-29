"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Save,
  SaveAll,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ReportEntry } from "@/lib/types";
import { ErrorPanel, LoadingPanel } from "@/components/ui";

type RowStatus = "clean" | "dirty" | "saving" | "saved" | "deleting" | "error";
type EditorRow = ReportEntry & { clientKey: string; status: RowStatus };

type Suggestions = {
  time_ranges: string[];
  doctor_names: string[];
  districts: string[];
};

const emptySuggestions: Suggestions = {
  time_ranges: [],
  doctor_names: [],
  districts: [],
};

function keyFor(entry?: ReportEntry) {
  if (entry?.id) return `server-${entry.id}`;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function blankRow(date: string): EditorRow {
  return {
    clientKey: keyFor(),
    status: "clean",
    date,
    time_range: "",
    doctor_name: "",
    district: "",
    client_type: "doctor",
    new_client: false,
    orders: "",
    samples: "",
    tel_orders: "",
    new_product_intro: "",
    old_product_followup: "",
    delivery_time_update: "",
    salesman_name: "",
  };
}

function isBlank(row: ReportEntry) {
  return ![
    row.time_range,
    row.doctor_name,
    row.district,
    row.orders,
    row.samples,
    row.tel_orders,
    row.new_product_intro,
    row.old_product_followup,
    row.delivery_time_update,
  ].some((value) => value?.trim());
}

function payload(row: EditorRow) {
  return {
    date: row.date,
    time_range: row.time_range,
    doctor_name: row.doctor_name,
    district: row.district,
    client_type: row.client_type,
    new_client: row.new_client,
    orders: row.orders,
    samples: row.samples,
    tel_orders: row.tel_orders,
    new_product_intro: row.new_product_intro,
    old_product_followup: row.old_product_followup,
    delivery_time_update: row.delivery_time_update,
  };
}

export default function ReportEditor() {
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [rows, setRows] = useState<EditorRow[]>([]);
  const [savingAll, setSavingAll] = useState(false);
  const rowsRef = useRef(rows);
  const queryClient = useQueryClient();

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const reports = useQuery({
    queryKey: ["reports", date],
    queryFn: () => api<ReportEntry[]>(`report-entries/?date=${date}`),
    staleTime: 10_000,
  });

  const suggestions = useQuery({
    queryKey: ["report-suggestions"],
    queryFn: () => api<Suggestions>("report-entry-suggestions/"),
    staleTime: 30 * 60_000,
  });

  useEffect(() => {
    if (!reports.data) return;
    setRows([
      ...reports.data.map((entry) => ({
        ...entry,
        clientKey: keyFor(entry),
        status: "clean" as RowStatus,
      })),
      blankRow(date),
    ]);
  }, [date, reports.data]);

  const updateRow = <K extends keyof ReportEntry>(
    index: number,
    field: K,
    value: ReportEntry[K],
  ) => {
    setRows((current) => {
      const next = current.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, [field]: value, status: "dirty" as RowStatus }
          : row,
      );
      if (index === current.length - 1 && isBlank(current[index])) {
        next.push(blankRow(date));
      }
      return next;
    });
  };

  const updateQueryCache = (saved: ReportEntry) => {
    queryClient.setQueryData<ReportEntry[]>(["reports", date], (current = []) => {
      const found = current.some((entry) => String(entry.id) === String(saved.id));
      return found
        ? current.map((entry) =>
            String(entry.id) === String(saved.id) ? saved : entry,
          )
        : [...current, saved];
    });
    void queryClient.invalidateQueries({
      queryKey: ["dashboard"],
      refetchType: "none",
    });
  };

  const saveRow = async (index: number) => {
    const row = rowsRef.current[index];
    if (!row || isBlank(row) || row.status === "saving" || row.status === "deleting") {
      return true;
    }

    const clientKey = row.clientKey;
    setRows((current) =>
      current.map((item) =>
        item.clientKey === clientKey ? { ...item, status: "saving" } : item,
      ),
    );

    try {
      const saved = await api<ReportEntry>(
        row.id ? `report-entries/${row.id}/` : "report-entries/",
        {
          method: row.id ? "PATCH" : "POST",
          body: JSON.stringify(payload(row)),
        },
      );

      setRows((current) =>
        current.map((item) =>
          item.clientKey === clientKey
            ? { ...saved, clientKey, status: "saved" }
            : item,
        ),
      );
      updateQueryCache(saved);

      window.setTimeout(() => {
        setRows((current) =>
          current.map((item) =>
            item.clientKey === clientKey && item.status === "saved"
              ? { ...item, status: "clean" }
              : item,
          ),
        );
      }, 1000);
      return true;
    } catch {
      setRows((current) =>
        current.map((item) =>
          item.clientKey === clientKey ? { ...item, status: "error" } : item,
        ),
      );
      return false;
    }
  };

  const deleteRow = async (index: number) => {
    const row = rowsRef.current[index];
    if (!row) return;

    const snapshot = rowsRef.current;
    setRows((current) => current.filter((item) => item.clientKey !== row.clientKey));

    if (!row.id) return;

    try {
      await api(`report-entries/${row.id}/`, { method: "DELETE" });
      queryClient.setQueryData<ReportEntry[]>(["reports", date], (current = []) =>
        current.filter((entry) => String(entry.id) !== String(row.id)),
      );
      void queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "none" });
    } catch {
      setRows(snapshot);
    }
  };

  const saveAll = async () => {
    const indexes = rowsRef.current
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.status === "dirty" && !isBlank(row))
      .map(({ index }) => index);

    if (!indexes.length) return;
    setSavingAll(true);
    await Promise.all(indexes.map(saveRow));
    setSavingAll(false);
  };

  const handleBlur = (
    index: number,
    event: React.FocusEvent<HTMLDivElement>,
  ) => {
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) return;
    const row = rowsRef.current[index];
    if (row?.status === "dirty") void saveRow(index);
  };

  const previousDay = () =>
    setDate((current) => format(addDays(new Date(`${current}T12:00:00`), -1), "yyyy-MM-dd"));
  const nextDay = () =>
    setDate((current) => {
      const candidate = addDays(new Date(`${current}T12:00:00`), 1);
      return candidate > new Date() ? current : format(candidate, "yyyy-MM-dd");
    });

  const dirtyCount = useMemo(
    () => rows.filter((row) => row.status === "dirty" && !isBlank(row)).length,
    [rows],
  );

  if (reports.isLoading) return <LoadingPanel rows={5} />;
  if (reports.error) return <ErrorPanel message="Unable to load report entries." />;

  const suggestionData = suggestions.data || emptySuggestions;

  return (
    <div className="space-y-4">
      <datalist id="doctor-suggestions">
        {suggestionData.doctor_names.map((value) => <option key={value} value={value} />)}
      </datalist>
      <datalist id="district-suggestions">
        {suggestionData.districts.map((value) => <option key={value} value={value} />)}
      </datalist>
      <datalist id="time-suggestions">
        {suggestionData.time_ranges.map((value) => <option key={value} value={value} />)}
      </datalist>

      <div className="surface flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-2">
          <button className="btn-secondary !p-2.5" onClick={previousDay} aria-label="Previous day">
            <ArrowLeft size={17} />
          </button>
          <input
            type="date"
            className="soft-input !w-auto !py-2"
            value={date}
            max={format(new Date(), "yyyy-MM-dd")}
            onChange={(event) => setDate(event.target.value)}
          />
          <button className="btn-secondary !p-2.5" onClick={nextDay} aria-label="Next day">
            <ArrowRight size={17} />
          </button>
        </div>
        <button
          className="btn-primary"
          onClick={saveAll}
          disabled={!dirtyCount || savingAll}
        >
          <SaveAll size={17} />
          {savingAll ? "Saving…" : dirtyCount ? `Save all (${dirtyCount})` : "All saved"}
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const blank = isBlank(row);
          return (
            <div
              key={row.clientKey}
              onBlur={(event) => handleBlur(index, event)}
              className="surface overflow-hidden"
            >
              <div className="grid gap-3 p-4 md:grid-cols-6">
                <label className="md:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-[#747c86]">Time</span>
                  <input
                    list="time-suggestions"
                    className="soft-input"
                    value={row.time_range}
                    placeholder="0900-1000"
                    onChange={(event) => updateRow(index, "time_range", event.target.value)}
                  />
                </label>
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-[#747c86]">Client</span>
                  <input
                    list="doctor-suggestions"
                    className="soft-input"
                    value={row.doctor_name}
                    placeholder="Client name"
                    onChange={(event) => updateRow(index, "doctor_name", event.target.value)}
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-[#747c86]">District</span>
                  <input
                    list="district-suggestions"
                    className="soft-input"
                    value={row.district}
                    placeholder="District"
                    onChange={(event) => updateRow(index, "district", event.target.value)}
                  />
                </label>
                <label className="md:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-[#747c86]">Type</span>
                  <select
                    className="soft-input"
                    value={row.client_type}
                    onChange={(event) =>
                      updateRow(index, "client_type", event.target.value as "doctor" | "nurse")
                    }
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                </label>
                <label className="flex items-end pb-3 md:col-span-1">
                  <span className="flex items-center gap-2 text-sm text-[#555c65]">
                    <input
                      type="checkbox"
                      checked={row.new_client}
                      onChange={(event) => updateRow(index, "new_client", event.target.checked)}
                    />
                    New client
                  </span>
                </label>

                {[
                  ["orders", "Orders"],
                  ["tel_orders", "Telephone orders"],
                  ["samples", "Samples"],
                  ["new_product_intro", "New product intro"],
                  ["old_product_followup", "Product follow-up"],
                  ["delivery_time_update", "Delivery update"],
                ].map(([field, label]) => (
                  <label key={field} className="md:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-[#747c86]">{label}</span>
                    <textarea
                      className="soft-input min-h-[76px] resize-y"
                      value={String(row[field as keyof ReportEntry] || "")}
                      onChange={(event) =>
                        updateRow(
                          index,
                          field as keyof ReportEntry,
                          event.target.value as never,
                        )
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-[#edf0f2] bg-[#fafbfb] px-4 py-3">
                <div className="mr-auto min-w-[120px] text-sm">
                  {row.status === "dirty" && <span className="text-[#8a5a00]">Unsaved changes</span>}
                  {row.status === "saving" && <span className="text-[#69717d]">Saving…</span>}
                  {row.status === "saved" && (
                    <span className="inline-flex items-center gap-1 text-[#18794e]"><Check size={15} /> Saved</span>
                  )}
                  {row.status === "error" && <span className="text-[#a8241a]">Save failed — retry</span>}
                </div>

                {!blank && (
                  <button
                    className="btn-secondary !py-2"
                    disabled={row.status === "saving"}
                    onClick={() => void saveRow(index)}
                  >
                    <Save size={15} />
                    {row.id ? "Save changes" : "Save"}
                  </button>
                )}
                <button
                  className="btn-danger !py-2"
                  disabled={row.status === "saving"}
                  onClick={() => void deleteRow(index)}
                  aria-label="Delete row"
                >
                  <Trash2 size={15} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="btn-secondary"
        onClick={() => setRows((current) => [...current, blankRow(date)])}
      >
        <Plus size={17} /> Add entry
      </button>
    </div>
  );
}
