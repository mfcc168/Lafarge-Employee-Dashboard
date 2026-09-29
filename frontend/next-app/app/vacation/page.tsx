"use client";

import { FormEvent, PointerEvent, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  ALL_MANAGEMENT,
  type DateItem,
  type VacationRequest,
} from "@/lib/types";
import {
  Badge,
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  PageHeader,
  StatCard,
} from "@/components/ui";

function SignaturePad({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext("2d");
    if (!context) return;
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
  };

  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const p = point(event);
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.strokeStyle = "#202327";
    context.lineTo(p.x, p.y);
    context.stroke();
  };

  const end = () => {
    drawing.current = false;
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[#dfe3e8] bg-white">
        <canvas
          ref={canvasRef}
          width={700}
          height={180}
          className="h-36 w-full touch-none"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      </div>
      <button type="button" className="mt-2 text-sm font-medium text-[#6d7580] hover:text-[#202327]" onClick={clear}>
        Clear signature
      </button>
    </div>
  );
}

function requestDates(request: VacationRequest) {
  return request.date_items
    .map((item) =>
      item.type === "half"
        ? `${item.single_date} (${item.half_day_period})`
        : item.from_date === item.to_date
          ? item.from_date
          : `${item.from_date} → ${item.to_date}`,
    )
    .join(", ");
}

export default function VacationPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const isManagement = !!user && ALL_MANAGEMENT.includes(user.role);

  const personal = useQuery({
    queryKey: ["vacations", "mine"],
    queryFn: () => api<VacationRequest[]>("vacations/me/"),
    enabled: !!user && !isManagement,
  });

  const team = useQuery({
    queryKey: ["vacations", "team"],
    queryFn: () => api<VacationRequest[]>("vacations/"),
    enabled: !!user && isManagement,
  });

  const [items, setItems] = useState<DateItem[]>([
    { type: "full", from_date: "", to_date: "", leave_type: "Annual Leave" },
  ]);
  const [signature, setSignature] = useState("");
  const [submitError, setSubmitError] = useState("");

  const createRequest = useMutation({
    mutationFn: () =>
      api<VacationRequest>("vacation/create", {
        method: "POST",
        body: JSON.stringify({ date_items: items, signature_data: signature }),
      }),
    onSuccess: async () => {
      setItems([
        { type: "full", from_date: "", to_date: "", leave_type: "Annual Leave" },
      ]);
      setSignature("");
      setSubmitError("");
      await queryClient.invalidateQueries({ queryKey: ["vacations"] });
      await refreshUser();
    },
    onError: (error) => {
      setSubmitError(error instanceof Error ? error.message : "Request failed");
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "approved" | "rejected";
    }) =>
      api<VacationRequest>(`vacation/${id}/update/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<VacationRequest[]>(
        ["vacations", "team"],
        (current = []) =>
          current.map((request) =>
            request.id === updated.id ? updated : request,
          ),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["vacations"] });
    },
  });

  const pendingCount = useMemo(
    () => (team.data || []).filter((request) => request.status === "pending").length,
    [team.data],
  );

  if (!user) return null;

  if (isManagement) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vacation management"
          description="Review pending requests and keep leave balances consistent."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Pending" value={pendingCount} />
          <StatCard
            label="Approved"
            value={(team.data || []).filter((request) => request.status === "approved").length}
          />
          <StatCard
            label="Rejected"
            value={(team.data || []).filter((request) => request.status === "rejected").length}
          />
        </div>

        {team.isLoading ? (
          <LoadingPanel rows={5} />
        ) : team.error ? (
          <ErrorPanel message="Unable to load vacation requests." />
        ) : !team.data?.length ? (
          <EmptyState title="No vacation requests" />
        ) : (
          <div className="surface overflow-hidden">
            <div className="divide-y divide-[#edf0f2]">
              {team.data.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[#25292e]">{request.employee}</span>
                      <Badge
                        tone={
                          request.status === "approved"
                            ? "success"
                            : request.status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[#69717d]">{requestDates(request)}</p>
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary !py-2"
                        disabled={updateStatus.isPending}
                        onClick={() =>
                          updateStatus.mutate({ id: request.id, status: "approved" })
                        }
                      >
                        <Check size={15} /> Approve
                      </button>
                      <button
                        className="btn-danger !py-2"
                        disabled={updateStatus.isPending}
                        onClick={() =>
                          updateStatus.mutate({ id: request.id, status: "rejected" })
                        }
                      >
                        <X size={15} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const updateItem = (index: number, patch: Partial<DateItem>) =>
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    if (!signature) {
      setSubmitError("Please sign the request before submitting.");
      return;
    }
    createRequest.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My vacation"
        description="Submit leave requests and track their approval status."
      />
      <StatCard
        label="Annual leave remaining"
        value={`${user.annual_leave_days ?? 0} days`}
      />

      <form onSubmit={submit} className="surface space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="font-semibold">Requested leave</h2>
          <p className="mt-1 text-sm text-[#7a828c]">
            Add full-day or half-day leave items.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl border border-[#e5e8eb] bg-[#fafbfb] p-4 md:grid-cols-6"
            >
              <select
                className="soft-input md:col-span-1"
                value={item.type}
                onChange={(event) =>
                  updateItem(index, {
                    type: event.target.value as "full" | "half",
                    from_date: "",
                    to_date: "",
                    single_date: "",
                  })
                }
              >
                <option value="full">Full day</option>
                <option value="half">Half day</option>
              </select>

              {item.type === "full" ? (
                <>
                  <input
                    className="soft-input md:col-span-2"
                    type="date"
                    value={item.from_date || ""}
                    onChange={(event) =>
                      updateItem(index, { from_date: event.target.value })
                    }
                    required
                  />
                  <input
                    className="soft-input md:col-span-2"
                    type="date"
                    value={item.to_date || ""}
                    onChange={(event) =>
                      updateItem(index, { to_date: event.target.value })
                    }
                    required
                  />
                </>
              ) : (
                <>
                  <input
                    className="soft-input md:col-span-2"
                    type="date"
                    value={item.single_date || ""}
                    onChange={(event) =>
                      updateItem(index, { single_date: event.target.value })
                    }
                    required
                  />
                  <select
                    className="soft-input md:col-span-2"
                    value={item.half_day_period || "AM"}
                    onChange={(event) =>
                      updateItem(index, {
                        half_day_period: event.target.value as "AM" | "PM",
                      })
                    }
                  >
                    <option value="AM">Morning</option>
                    <option value="PM">Afternoon</option>
                  </select>
                </>
              )}

              <div className="flex gap-2 md:col-span-1">
                <select
                  className="soft-input"
                  value={item.leave_type || "Annual Leave"}
                  onChange={(event) =>
                    updateItem(index, {
                      leave_type: event.target.value as "Annual Leave" | "Sick Leave",
                    })
                  }
                >
                  <option>Annual Leave</option>
                  <option>Sick Leave</option>
                </select>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="btn-danger !px-3"
                    onClick={() =>
                      setItems((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            setItems((current) => [
              ...current,
              { type: "full", from_date: "", to_date: "", leave_type: "Annual Leave" },
            ])
          }
        >
          <Plus size={16} /> Add leave item
        </button>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-[#4c535c]">Signature</h3>
          <SignaturePad onChange={setSignature} />
        </div>

        {submitError && <ErrorPanel message={submitError} />}

        <button className="btn-primary" disabled={createRequest.isPending}>
          {createRequest.isPending ? "Submitting…" : "Submit request"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My requests</h2>
        {personal.isLoading ? (
          <LoadingPanel rows={3} />
        ) : personal.error ? (
          <ErrorPanel message="Unable to load your vacation requests." />
        ) : !personal.data?.length ? (
          <EmptyState title="No vacation requests yet" />
        ) : (
          <div className="surface divide-y divide-[#edf0f2] overflow-hidden">
            {personal.data.map((request) => (
              <div key={request.id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[#34383e]">{requestDates(request)}</div>
                  <div className="mt-0.5 text-xs text-[#8a929c]">{request.submitted_at || ""}</div>
                </div>
                <Badge
                  tone={
                    request.status === "approved"
                      ? "success"
                      : request.status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
