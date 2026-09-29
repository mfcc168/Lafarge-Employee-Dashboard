import { cookies } from "next/headers";

export const ACCESS_COOKIE = "lafarge_access";
export const REFRESH_COOKIE = "lafarge_refresh";

const backendUrl = (process.env.BACKEND_INTERNAL_URL || "http://backend:8000").replace(/\/$/, "");
const cookieSecure = process.env.COOKIE_SECURE === "true";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure,
    path: "/",
    maxAge,
  };
}

export async function setAuthCookies(access: string, refresh?: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, cookieOptions(60 * 60 * 24 * 29));
  if (refresh) {
    store.set(REFRESH_COOKIE, refresh, cookieOptions(60 * 60 * 24 * 29));
  }
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  store.set(REFRESH_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}

async function refreshAccessToken() {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const response = await fetch(`${backendUrl}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!response.ok) {
    await clearAuthCookies();
    return null;
  }

  const data = (await response.json()) as { access?: string };
  if (!data.access) return null;
  await setAuthCookies(data.access);
  return data.access;
}

export async function backendRequest(
  path: string,
  init: RequestInit = {},
  retry = true,
) {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const headers = new Headers(init.headers);

  if (access) headers.set("Authorization", `Bearer ${access}`);

  const response = await fetch(
    `${backendUrl}/api/${path.replace(/^\/+/, "")}`,
    {
      ...init,
      headers,
      cache: "no-store",
    },
  );

  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${refreshed}`);
      return fetch(
        `${backendUrl}/api/${path.replace(/^\/+/, "")}`,
        {
          ...init,
          headers: retryHeaders,
          cache: "no-store",
        },
      );
    }
  }

  return response;
}

export function getBackendUrl() {
  return backendUrl;
}
