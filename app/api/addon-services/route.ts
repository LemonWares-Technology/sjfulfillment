import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Return an empty list for now, but always as valid JSON
  return new Response(
    JSON.stringify({ success: true, addonServices: [] }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
