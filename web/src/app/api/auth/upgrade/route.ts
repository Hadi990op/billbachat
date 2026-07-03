import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest, getUser, upgradePlan, getEffectivePlan, isPlanActive } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    const { plan, months } = await req.json();
    if (!["pro", "family"].includes(plan)) {
      return NextResponse.json(
        { success: false, error: "Invalid plan" },
        { status: 400 }
      );
    }

    const user = await getUser(auth.phone);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const updated = await upgradePlan(auth.phone, plan, months || 1);

    return NextResponse.json({
      success: true,
      message: `Plan upgraded to ${plan} for ${months || 1} month(s)`,
      user: {
        phone: updated!.phoneDisplay,
        name: updated!.name,
        plan: updated!.plan,
        planExpiry: updated!.planExpiry,
        effectivePlan: getEffectivePlan(updated!),
        planActive: isPlanActive(updated!),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
