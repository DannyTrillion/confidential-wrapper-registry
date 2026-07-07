import { NextRequest, NextResponse } from "next/server";

/**
 * Backend proxy for Zama's hosted MAINNET relayer, per their security guidance:
 * the API key must never reach the browser. The client points its relayerUrl at
 * /api/relayer; this route forwards the request upstream and injects the
 * `x-api-key` header from the server-only ZAMA_RELAYER_API_KEY env var.
 *
 * Sepolia never goes through here — its relayer is open and the client talks to
 * it directly.
 */
const UPSTREAM = "https://relayer.mainnet.zama.org";

async function forward(req: NextRequest, path: string[]) {
  const apiKey = process.env.ZAMA_RELAYER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        status: "failed",
        error: {
          message:
            "Relayer proxy is not configured — set ZAMA_RELAYER_API_KEY on the server.",
          label: "proxy_not_configured",
        },
      },
      { status: 503 },
    );
  }

  const url = `${UPSTREAM}/${path.join("/")}${req.nextUrl.search}`;
  const headers: Record<string, string> = { "x-api-key": apiKey };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    // The relayer is an external service; never cache decrypt traffic.
    cache: "no-store",
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
