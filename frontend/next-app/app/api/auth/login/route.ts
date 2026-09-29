import { NextResponse } from "next/server";
import { getBackendUrl, setAuthCookies } from "@/lib/server-auth";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));

  const tokenResponse = await fetch(`${getBackendUrl()}/api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok) {
    return NextResponse.json(tokenData, { status: tokenResponse.status });
  }

  await setAuthCookies(tokenData.access, tokenData.refresh);

  const userResponse = await fetch(`${getBackendUrl()}/api/protected-endpoint/`, {
    headers: { Authorization: `Bearer ${tokenData.access}` },
    cache: "no-store",
  });
  const user = await userResponse.json().catch(() => ({}));

  if (!userResponse.ok) {
    return NextResponse.json(user, { status: userResponse.status });
  }

  return NextResponse.json({ user });
}
