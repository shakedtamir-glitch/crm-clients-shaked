import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleOAuthUrl } from "@/lib/google/calendar";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/settings?google_error=not_admin", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = new URL("/api/google/callback", request.url).toString();
  const authUrl = getGoogleOAuthUrl(redirectUri, state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
