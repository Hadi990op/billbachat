import { NextRequest, NextResponse } from "next/server";
import { getUser, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { success: false, error: "Sahi phone number daalein" },
        { status: 400 }
      );
    }

    // Normalize phone for lookup
    let normalized = phone.replace(/\D/g, "");
    if (normalized.startsWith("0")) normalized = "92" + normalized.slice(1);
    if (normalized.length === 10) normalized = "92" + normalized;

    const user = await getUser(normalized);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Ye number se koi account nahi. Signup karein pehle.",
        },
        { status: 404 }
      );
    }

    const token = createToken(user);

    return NextResponse.json({
      success: true,
      token,
      user: {
        phone: user.phoneDisplay,
        name: user.name,
        plan: user.plan,
        planExpiry: user.planExpiry,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
