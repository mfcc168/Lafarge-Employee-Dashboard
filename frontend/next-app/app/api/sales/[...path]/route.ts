import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/server-auth";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: Request, context: RouteContext) {
  const base = process.env.SALES_API_URL?.replace(/\/$/, "");
  if (!base) {
    return Response.json(
      { detail: "SALES_API_URL is not configured for this deployment." },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const url = new URL(request.url);
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const headers = new Headers();

  if (access) headers.set("Authorization", `Bearer ${access}`);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength) body = buffer;
  }

  const upstream = await fetch(
    `${base}/${path.join("/")}${url.search}`,
    {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    },
  );

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
