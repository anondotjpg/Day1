// app/api/auth/x/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("x_oauth_state")?.value;
  const codeVerifier = cookieStore.get("x_code_verifier")?.value;
  const returnTo = cookieStore.get("x_return_to")?.value || "/day/0";

  // Clear the temporary cookies
  cookieStore.delete("x_oauth_state");
  cookieStore.delete("x_code_verifier");
  cookieStore.delete("x_return_to");

  // Handle errors from X
  if (error) {
    console.error("X OAuth error:", error);
    return NextResponse.redirect(new URL(`${returnTo}?error=auth_denied`, request.url));
  }

  // Validate state to prevent CSRF
  if (!state || state !== storedState) {
    console.error("State mismatch");
    return NextResponse.redirect(new URL(`${returnTo}?error=invalid_state`, request.url));
  }

  if (!code || !codeVerifier) {
    console.error("Missing code or verifier");
    return NextResponse.redirect(new URL(`${returnTo}?error=missing_params`, request.url));
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Missing X OAuth configuration");
    return NextResponse.redirect(new URL(`${returnTo}?error=config_error`, request.url));
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(new URL(`${returnTo}?error=token_exchange`, request.url));
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Fetch user info
    const userResponse = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch user info");
      return NextResponse.redirect(new URL(`${returnTo}?error=user_fetch`, request.url));
    }

    const userData = await userResponse.json();
    const username = userData.data?.username;

    // Store tokens in secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    cookieStore.set("x_access_token", access_token, {
      ...cookieOptions,
      maxAge: expires_in || 7200, // Default 2 hours
    });

    if (refresh_token) {
      cookieStore.set("x_refresh_token", refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    if (username) {
      cookieStore.set("x_username", username, {
        ...cookieOptions,
        httpOnly: false, // Allow client-side access for display
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    // Redirect back to the app
    return NextResponse.redirect(new URL(`${returnTo}?connected=true`, request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL(`${returnTo}?error=unknown`, request.url));
  }
}