import { NextRequest, NextResponse } from "next/server";
import { createUser, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone, name } = await req.json();

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { success: false, error: "Sahi phone number daalein (03XXXXXXXXX)" },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Naam daalein (kam az kam 2 harf)" },
        { status: 400 }
      );
    }

    const user = await createUser(phone, name);
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
