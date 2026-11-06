import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
/** Minimal liveness probe. Deliberately exposes no environment, version-internal or user data. */
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
