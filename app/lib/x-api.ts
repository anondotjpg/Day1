// lib/x-api.ts

import { cookies } from "next/headers";

interface XApiOptions {
  endpoint: string;
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
}

interface XApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Make authenticated requests to the X API
 */
export async function xApi<T>({
  endpoint,
  method = "GET",
  body,
}: XApiOptions): Promise<XApiResponse<T>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("x_access_token")?.value;

  if (!accessToken) {
    return { data: null, error: "Not authenticated with X" };
  }

  try {
    const response = await fetch(`https://api.twitter.com/2${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired - could implement refresh logic here
        return { data: null, error: "Token expired" };
      }
      return { data: null, error: `X API error: ${response.status}` };
    }

    const data = await response.json();
    return { data: data.data, error: null };
  } catch (error) {
    console.error("X API request failed:", error);
    return { data: null, error: "Request failed" };
  }
}

/**
 * Refresh the X access token using the refresh token
 */
export async function refreshXToken(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("x_refresh_token")?.value;

  if (!refreshToken) {
    return false;
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return false;
  }

  try {
    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const tokens = await response.json();
    const { access_token, refresh_token: newRefreshToken, expires_in } = tokens;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    cookieStore.set("x_access_token", access_token, {
      ...cookieOptions,
      maxAge: expires_in || 7200,
    });

    if (newRefreshToken) {
      cookieStore.set("x_refresh_token", newRefreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

/**
 * Get the current user's X profile
 */
export async function getXUser() {
  return xApi<{
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  }>({
    endpoint: "/users/me?user.fields=profile_image_url",
  });
}

/**
 * Post a tweet
 */
export async function postTweet(text: string) {
  return xApi<{ id: string; text: string }>({
    endpoint: "/tweets",
    method: "POST",
    body: { text },
  });
}