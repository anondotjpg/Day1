// app/api/auth/x/disconnect/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();

  // Optionally revoke the token at X's API
  const accessToken = cookieStore.get("x_access_token")?.value;
  
  if (accessToken) {
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    if (clientId && clientSecret) {
      try {
        await fetch("https://api.twitter.com/2/oauth2/revoke", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            token: accessToken,
            token_type_hint: "access_token",
          }),
        });
      } catch (error) {
        console.error("Failed to revoke token:", error);
        // Continue with local cleanup even if revocation fails
      }
    }
  }

  // Clear all X-related cookies
  cookieStore.delete("x_access_token");
  cookieStore.delete("x_refresh_token");
  cookieStore.delete("x_username");

  return NextResponse.json({ success: true });
}