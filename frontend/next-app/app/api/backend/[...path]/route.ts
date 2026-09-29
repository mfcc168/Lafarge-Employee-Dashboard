import { backendRequest } from "@/lib/server-auth";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const url = new URL(request.url);
  const targetPath = `${path.join("/")}${url.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength) body = buffer;
  }

  const upstream = await backendRequest(targetPath, {
    method: request.method,
    headers,
    body,
  });

  const responseHeaders = new Headers();
  for (const name of ["content-type", "content-disposition", "location"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
