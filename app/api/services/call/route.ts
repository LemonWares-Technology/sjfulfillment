import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import axios from "axios";
import jwt from "jsonwebtoken";


// Sonetel API credentials from environment variables
const sonetelApiKey = process.env.SONETEL_API_KEY;
const sonetelAccountId = process.env.SONETEL_ACCOUNT_ID;
const sonetelFromNumber = process.env.SONETEL_FROM_NUMBER;

if (!sonetelApiKey || !sonetelAccountId || !sonetelFromNumber) {
  throw new Error("Missing Sonetel configuration (SONETEL_API_KEY, SONETEL_ACCOUNT_ID, SONETEL_FROM_NUMBER)");
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const user = getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { to, type, customerName, customerRole, notificationType } = data;

    if (!to || !type || !customerName) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }


    // Format the phone number to E.164 format (assuming NG default)
    const toRaw = String(to);
    let formattedNumber = toRaw.replace(/\D/g, "");
    if (!toRaw.startsWith("+")) {
      formattedNumber =
        "+234" +
        (formattedNumber.startsWith("0")
          ? formattedNumber.slice(1)
          : formattedNumber);
    } else {
      formattedNumber = toRaw;
    }


    // Log call settings
    const isProd = process.env.NODE_ENV === "production";
    console.log("Sonetel Call settings:", {
      originalNumber: formattedNumber,
      isProd,
      nodeEnv: process.env.NODE_ENV,
    });

    if (type === "audio") {
      // Sonetel API endpoint for call-back
  // Ensure no double slashes in endpoint
  const sonetelUrl = "https://api.sonetel.com/make-calls/call/call-back";
      // Prepare payload as per Sonetel documentation
      // Validate phone numbers for Sonetel API (must be E.164 format)
      const formatE164 = (num: string) => num.startsWith("+") ? num : `+${num.replace(/\D/g, "")}`;
      const payload = {
        call1: formatE164(String(sonetelFromNumber)),
        call2: formatE164(formattedNumber),
        show1: formatE164(String(sonetelFromNumber)),
        show2: formatE164(formattedNumber),
      };

      // Helper to mask token for logs
      const mask = (s: string | undefined) => (s ? `${s.slice(0, 8)}...` : 'missing');

      console.log('Attempting Sonetel call', {
        url: sonetelUrl,
        payload,
        tokenPreview: mask(sonetelApiKey),
      });

      let call: any = null;
      let lastError: any = null;
      try {
        const resp = await axios.post(sonetelUrl, payload, {
          headers: {
            Authorization: `Bearer ${sonetelApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });
        call = resp.data;
        console.log('Sonetel response', { url: sonetelUrl, status: resp.status, dataPreview: call && (call.id || call) });
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        const respData = err?.response?.data;
        console.warn(`Sonetel request failed`, { status, respData });
      }

      if (!call) {
        // No successful response from Sonetel; surface useful debug info
        console.error('Sonetel endpoint failed. Last error:', {
          message: lastError?.message,
          status: lastError?.response?.status,
          data: lastError?.response?.data,
        });
        const message = lastError?.response?.data?.message || lastError?.response?.data || lastError?.message || 'Sonetel request failed';
        return NextResponse.json({ success: false, message }, { status: 502 });
      }

      // Save the call record
      await prisma.callLog.create({
        data: {
          callSid: call.id || `${Date.now()}`,
          to: formattedNumber,
          from: String(sonetelFromNumber),
          type: "VOICE",
          status: "INITIATED",
          customerName,
          customerRole,
          notificationType,
        },
      });

      return NextResponse.json({ success: true, callSid: call.id });
    } else if (type === "video") {
      // Sonetel does not support video calls via API
      return NextResponse.json(
        { success: false, message: "Video calls are not supported with Sonetel API. Use audio calls for now." },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid call type" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error initiating call:", error);
    const message = error?.response?.data?.title || error?.response?.data?.detail || error?.message || "Failed to initiate call";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
