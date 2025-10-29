import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Print all cookies received for debugging
  const cookies = request.cookies;
  // eslint-disable-next-line no-console
  console.log("[DEBUG] Cookies received:", cookies);
  return new Response(
    JSON.stringify({ cookies: Object.fromEntries(cookies) }, null, 2),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
