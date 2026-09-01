import { NextRequest, NextResponse } from "next/server";

const DEMO_USERNAME = "dispatcher";
const DEMO_PASSWORD = "freight2026";

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) {
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = formData.get("username")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const baseUrl = getBaseUrl(request);

  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    const dashboardUrl = new URL("/demo-terminal/dashboard", baseUrl);
    const response = NextResponse.redirect(dashboardUrl, 303);
    response.cookies.set("demo_session", "authenticated", {
      path: "/",
      maxAge: 3600,
      httpOnly: true,
      sameSite: "lax",
    });
    return response;
  }

  const loginUrl = new URL("/demo-terminal/login?error=invalid", baseUrl);
  return NextResponse.redirect(loginUrl, 303);
}
