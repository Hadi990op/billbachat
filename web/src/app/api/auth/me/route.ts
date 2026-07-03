import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest, getUser, getEffectivePlan, isPlanActive, canCheckBill } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    const user = await getUser(auth.phone);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const effectivePlan = getEffectivePlan(user);
    const planActive = isPlanActive(user);
    const checkStatus = canCheckBill(user);

    return NextResponse.json({
      success: true,
      user: {
        phone: user.phoneDisplay,
        name: user.name,
        plan: user.plan,
        effectivePlan,
        planActive,
        planExpiry: user.planExpiry,
        createdAt: user.createdAt,
        billChecksToday: user.billChecksToday,
        lastCheckDate: user.lastCheckDate,
        refNos: user.refNos,
      },
      canCheckBill: checkStatus,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
