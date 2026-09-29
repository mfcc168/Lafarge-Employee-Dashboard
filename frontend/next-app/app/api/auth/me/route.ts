import { NextResponse } from "next/server";
import { backendRequest, clearAuthCookies } from "@/lib/server-auth";

export async function GET() {
  const response = await backendRequest("protected-endpoint/");

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await clearAuthCookies();
    }
    const data = await response.json().catch(() => ({ detail: "Not authenticated" }));
    return NextResponse.json(data, { status: response.status });
  }

  const user = await response.json();
  return NextResponse.json({ user });
}
