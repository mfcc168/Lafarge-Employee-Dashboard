export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail?: unknown }).detail)
        : `Request failed (${response.status})`;
    throw new ApiError(detail, response.status, data);
  }

  return data as T;
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const normalized = path.replace(/^\/+/, "");
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api/backend/${normalized}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  return parseResponse<T>(response);
}

export async function salesApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const normalized = path.replace(/^\/+/, "");
  const response = await fetch(`/api/sales/${normalized}`, {
    ...init,
    cache: "no-store",
  });
  return parseResponse<T>(response);
}

export async function apiBlob(
  path: string,
  init: RequestInit = {},
): Promise<Blob> {
  const normalized = path.replace(/^\/+/, "");
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api/backend/${normalized}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, response.status);
  }

  return response.blob();
}
