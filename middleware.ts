import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/auth/session";
import { SESSION_OPTIONS } from "@/lib/auth/session";

const PUBLIC_PATHS  = ["/book", "/api/booking", "/api/auth"];
const AUTH_PATHS    = ["/login", "/signup"];
const OPEN_API      = ["/api/setup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    OPEN_API.some(p => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(request, res, SESSION_OPTIONS);

  const isAuthed = session.isLoggedIn === true;

  if (!isAuthed && !AUTH_PATHS.some(p => pathname.startsWith(p)) && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthed && AUTH_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
