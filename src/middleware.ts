import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt, jwtVerify } from "jose";

const ONBOARDING_ROUTE = "/onboarding";
const ONBOARDED_ONLY_ROUTES = ["/dashboard", "/schedule", "/campaigns", "/inbox", "/team", "/alerts"];
const AUTH_ROUTES = ["/signup", "/login", "/verify-email"];
const ROOT_ROUTE = "/";

interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
}

interface JwtPayloadShape {
  workspaceId?: string | null;
  currentWorkspaceId?: string | null;
  workspace?: {
    id?: string | null;
  } | null;
}

async function getAuthState(request: NextRequest): Promise<AuthState> {
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    return { isAuthenticated: false, isOnboarded: false };
  }

  try {
    const secretValue =
      process.env.JWT_SECRET ||
      process.env.AUTH_JWT_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "";

    const payload = (secretValue
      ? (
          await jwtVerify(
            token,
            new TextEncoder().encode(secretValue),
          )
        ).payload
      : decodeJwt(token)) as JwtPayloadShape;

    const workspaceId =
      payload.workspaceId ??
      payload.currentWorkspaceId ??
      payload.workspace?.id ??
      null;

    return {
      isAuthenticated: true,
      isOnboarded: workspaceId != null,
    };
  } catch {
    return { isAuthenticated: false, isOnboarded: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authState = await getAuthState(request);

  if (pathname === ROOT_ROUTE) {
    if (!authState.isAuthenticated) {
      return NextResponse.redirect(new URL("/signup", request.url));
    }

    if (authState.isOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (pathname === ONBOARDING_ROUTE) {
    if (!authState.isAuthenticated) {
      return NextResponse.redirect(new URL("/signup", request.url));
    }

    if (authState.isOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (ONBOARDED_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!authState.isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!authState.isOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    return NextResponse.next();
  }

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (authState.isAuthenticated && authState.isOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (authState.isAuthenticated && !authState.isOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/onboarding",
    "/dashboard/:path*",
    "/schedule/:path*",
    "/campaigns/:path*",
    "/inbox/:path*",
    "/team/:path*",
    "/alerts/:path*",
    "/signup",
    "/login",
    "/verify-email",
  ],
};
