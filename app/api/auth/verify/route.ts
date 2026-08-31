import { NextResponse } from "next/server";
import { verifyAdminAuth } from "@/lib/auth-guard";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (verifyAdminAuth(password)) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid passphrase" },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload" },
      { status: 400 },
    );
  }
}

