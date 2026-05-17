import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = process.env.SERVER_API_BASE || "https://iklanin.id";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetPath = path.join("/");
  const search = request.nextUrl.search || "";
  const targetUrl = `${BACKEND_BASE.replace(/\/$/, "")}/${targetPath}${search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const method = request.method;
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const resp = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const outHeaders = new Headers(resp.headers);
  outHeaders.delete("content-encoding");
  outHeaders.delete("transfer-encoding");

  return new NextResponse(resp.body, {
    status: resp.status,
    headers: outHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
