import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function proxyRequest(
  req: NextRequest,
  context: { params: { path?: string[] } | Promise<{ path?: string[] }> }
) {
  const targetBase = (process.env.CONSIMS_API_URL || "https://api.consims.com").replace(/\/$/, "");
  const params = await Promise.resolve(context?.params);
  const pathSegments = params?.path || [];
  const subpath = pathSegments.join("/");
  const search = req.nextUrl.search;
  const targetUrl = `${targetBase}/${subpath}${search}`;

  const forwardHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "host" && lower !== "connection" && lower !== "content-length") {
      forwardHeaders[key] = value;
    }
  });

  const method = req.method;
  const fetchOptions: RequestInit = {
    method,
    headers: forwardHeaders,
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const buffer = await req.arrayBuffer();
      fetchOptions.body = buffer;
    } else {
      const text = await req.text();
      fetchOptions.body = text;
    }
  }

  try {
    const backendRes = await fetch(targetUrl, fetchOptions);
    const responseHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower !== "content-encoding" &&
        lower !== "content-length" &&
        lower !== "transfer-encoding"
      ) {
        responseHeaders.set(key, value);
      }
    });

    const isNoBodyStatus = backendRes.status === 204 || backendRes.status === 205 || backendRes.status === 304;
    const responseBody = isNoBodyStatus ? null : await backendRes.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[Proxy Error] ${method} ${targetUrl}:`, err);
    return NextResponse.json(
      {
        Success: "false",
        Message: `Không thể kết nối đến máy chủ ERP backend (${targetBase}): ${err.message}`,
        error: err.message,
      },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const OPTIONS = proxyRequest;
