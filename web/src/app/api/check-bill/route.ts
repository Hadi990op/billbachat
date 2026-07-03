import { NextRequest, NextResponse } from "next/server";
import { fetchPITCBill, DISCOS } from "@/lib/pitc";
import {
  getAuthFromRequest,
  getUser,
  getEffectivePlan,
  canCheckBill,
  incrementBillCheck,
  addRefNo,
} from "@/lib/auth";

async function validateInputs(refNo: string | null, company: string | null) {
  if (!refNo) {
    return { error: "Reference number required (?ref=...)" };
  }
  if (!company) {
    return { error: "Company code required (?company=lesco)" };
  }
  if (!refNo.match(/^\d{10,14}$/)) {
    return { error: "Reference number must be 10-14 digits" };
  }
  const validDisco = DISCOS.find((d) => d.code === company.toLowerCase());
  if (!validDisco) {
    return {
      error: `Invalid company. Supported: ${DISCOS.map((d) => d.code).join(", ")}`,
    };
  }
  return { disco: validDisco };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const refNo = searchParams.get("ref");
  const company = searchParams.get("company");

  const validation = await validateInputs(refNo, company);
  if ("error" in validation) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  // === AUTH + PLAN GATING ===
  const auth = getAuthFromRequest(request);
  let userPlan = "free";
  let userPhone: string | null = null;
  let checkStatus = { allowed: true, remaining: 1 };

  if (auth) {
    const user = await getUser(auth.phone);
    if (user) {
      userPlan = getEffectivePlan(user);
      userPhone = auth.phone;
      checkStatus = canCheckBill(user);

      if (!checkStatus.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: "limit_reached",
            message:
              "Aaj ka free bill check khatam ho gaya. Pro lein for unlimited checks.",
            plan: userPlan,
            remaining: 0,
            upgradeUrl: "/billbachat/pricing/",
          },
          { status: 403 }
        );
      }

      // Increment check count
      await incrementBillCheck(auth.phone);

      // Save ref no
      await addRefNo(auth.phone, refNo!, company!);
    }
  }

  const bill = await fetchPITCBill(refNo!, validation.disco!.code);

  return NextResponse.json(
    {
      ...bill,
      _meta: {
        plan: userPlan,
        remaining: checkStatus.remaining,
        loggedIn: !!userPhone,
      },
    },
    {
      status: bill.success ? 200 : 404,
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refNo, company } = body;

    const validation = await validateInputs(refNo, company);
    if ("error" in validation) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // === AUTH + PLAN GATING ===
    const auth = getAuthFromRequest(request);
    let userPlan = "free";
    let checkStatus = { allowed: true, remaining: 1 };

    if (auth) {
      const user = await getUser(auth.phone);
      if (user) {
        userPlan = getEffectivePlan(user);
        checkStatus = canCheckBill(user);

        if (!checkStatus.allowed) {
          return NextResponse.json(
            {
              success: false,
              error: "limit_reached",
              message: "Free limit reached. Upgrade to Pro for unlimited.",
              plan: userPlan,
              remaining: 0,
              upgradeUrl: "/billbachat/pricing/",
            },
            { status: 403 }
          );
        }

        await incrementBillCheck(auth.phone);
        await addRefNo(auth.phone, refNo, company);
      }
    }

    const bill = await fetchPITCBill(refNo, validation.disco!.code);

    return NextResponse.json(
      {
        ...bill,
        _meta: {
          plan: userPlan,
          remaining: checkStatus.remaining,
          loggedIn: !!auth,
        },
      },
      {
        status: bill.success ? 200 : 404,
        headers: { "Cache-Control": "public, max-age=3600" },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
