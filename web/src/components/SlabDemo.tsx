"use client";

import { useState, useMemo } from "react";

// NEPRA 2026 slab rates (simplified for demo)
const SLABS = [
  { max: 100, rate: 7.74, label: "1-100 units" },
  { max: 200, rate: 10.25, label: "101-200 units" },
  { max: 300, rate: 14.65, label: "201-300 units" },
  { max: 400, rate: 16.42, label: "301-400 units" },
  { max: 999, rate: 20.50, label: "401+ units" },
];

const FIXED_CHARGES = 400; // approx fixed charges + taxes multiplier
const TAX_MULTIPLIER = 1.17; // 17% approx taxes

function calculateBill(units: number) {
  let energyCost = 0;
  let prevMax = 0;
  for (const slab of SLABS) {
    if (units > prevMax) {
      const slabUnits = Math.min(units, slab.max) - prevMax;
      energyCost += slabUnits * slab.rate;
      prevMax = slab.max;
    } else break;
  }
  const total = (energyCost + FIXED_CHARGES) * TAX_MULTIPLIER;
  return Math.round(total);
}

function getSlabInfo(units: number) {
  for (let i = 0; i < SLABS.length; i++) {
    if (units <= SLABS[i].max) {
      const isProtected = units <= 200;
      const nextSlab = i < SLABS.length - 1 ? SLABS[i + 1] : null;
      return {
        current: SLABS[i],
        index: i,
        isProtected,
        nextSlab,
      };
    }
  }
  return { current: SLABS[SLABS.length - 1], index: SLABS.length - 1, isProtected: false, nextSlab: null };
}

export default function SlabDemo() {
  const [units, setUnits] = useState(185);

  const bill = useMemo(() => calculateBill(units), [units]);
  const slabInfo = useMemo(() => getSlabInfo(units), [units]);

  // Calculate bill at next slab boundary
  const billAt200 = useMemo(() => calculateBill(200), []);
  const billAt201 = useMemo(() => calculateBill(201), []);
  const jumpAmount = billAt201 - billAt200;

  // How close to 200
  const remaining = 200 - units;
  const isOver = units > 200;
  const isNear = units > 170 && units <= 200;

  // Colors
  const barColor = isOver ? "bg-red-500" : isNear ? "bg-amber-500" : "bg-emerald-500";
  const statusColor = isOver ? "text-red-600" : isNear ? "text-amber-600" : "text-emerald-600";
  const statusBg = isOver ? "bg-red-50 border-red-200" : isNear ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";
  const statusText = isOver
    ? "🔴 LIMIT CROSS — bill double!"
    : isNear
    ? `⚠️ Sirf ${remaining} units baaki!`
    : `✅ Safe — ${remaining} units baaki`;

  // Animated bill jump
  const showJump = units >= 198 && units <= 203;

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-200 p-6 sm:p-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-extrabold text-stone-900 mb-1">
          Slab Rate Calculator
        </h3>
        <p className="text-stone-500 text-sm">
          Slider move karein — 1 unit ka farq = bill double
        </p>
      </div>

      {/* Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-stone-600">
            Monthly Units
          </span>
          <span className="text-3xl font-extrabold text-stone-900 tabular-nums">
            {units} <span className="text-base font-normal text-stone-400">units</span>
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="450"
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          className="w-full h-3 bg-stone-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #10b981 ${((200 - 50) / 400) * 100}%, #f59e0b ${((200 - 50) / 400) * 100}%, #f59e0b ${((250 - 50) / 400) * 100}%, #ef4444 ${((250 - 50) / 400) * 100}%, #ef4444 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-stone-400 mt-1">
          <span>50</span>
          <span className="font-bold text-emerald-600">200 (limit)</span>
          <span>450</span>
        </div>
      </div>

      {/* Status badge */}
      <div className={`rounded-2xl border-2 p-4 mb-6 text-center ${statusBg}`}>
        <p className={`text-lg font-bold ${statusColor}`}>
          {statusText}
        </p>
        {slabInfo.isProtected && (
          <p className="text-sm text-stone-500 mt-1">
            Aap abhi &quot;Protected Consumer&quot; me hain — sasta rate
          </p>
        )}
        {!slabInfo.isProtected && (
          <p className="text-sm text-stone-500 mt-1">
            Aap &quot;Non-Protected&quot; me chale gaye — mehenga rate
          </p>
        )}
      </div>

      {/* Bill display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-stone-50 rounded-2xl p-5 text-center">
          <p className="text-sm text-stone-500 mb-1">Is mahine ka bill</p>
          <p className={`text-3xl font-extrabold tabular-nums ${isOver ? "text-red-600" : "text-stone-900"} ${showJump ? "animate-bill-jump" : ""}`}>
            Rs. {bill.toLocaleString("en-PK")}
          </p>
        </div>
        <div className="bg-stone-50 rounded-2xl p-5 text-center">
          <p className="text-sm text-stone-500 mb-1">Per unit rate</p>
          <p className="text-3xl font-extrabold tabular-nums text-stone-900">
            Rs. {slabInfo.current.rate.toFixed(2)}
          </p>
        </div>
      </div>

      {/* The Slab Cliff visualization */}
      <div className="bg-gradient-to-r from-emerald-50 to-red-50 rounded-2xl p-5 border border-stone-200">
        <p className="text-sm font-semibold text-stone-700 mb-3 text-center">
          ⚡ The &quot;Slab Cliff&quot; — 200 unit ki limit
        </p>
        <div className="flex items-center justify-around gap-2">
          <div className="text-center flex-1">
            <p className="text-xs text-stone-500">200 units pe</p>
            <p className="text-xl font-bold text-emerald-600">
              Rs. {billAt200.toLocaleString("en-PK")}
            </p>
          </div>
          <div className="text-2xl text-stone-400">→</div>
          <div className="text-center flex-1">
            <p className="text-xs text-stone-500">201 units pe</p>
            <p className="text-xl font-bold text-red-600">
              Rs. {billAt201.toLocaleString("en-PK")}
            </p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-stone-500">Farq (1 unit)</p>
            <p className="text-xl font-bold text-red-600">
              +Rs. {jumpAmount.toLocaleString("en-PK")}
            </p>
          </div>
        </div>
        <p className="text-xs text-stone-400 text-center mt-3">
          Bas 1 unit zyada use karo — aur poore bill ka rate double ho jata hai!
        </p>
      </div>

      {/* BillBachat saves */}
      <div className="mt-6 bg-emerald-600 rounded-2xl p-5 text-center text-white">
        <p className="text-sm font-semibold mb-1">
          💰 BillBachat pehle bata deta hai!
        </p>
        <p className="text-lg font-bold">
          WhatsApp pe alert: &quot;Sirf 5 units baaki! AC band karo, Rs. {jumpAmount.toLocaleString("en-PK")} bachao!&quot;
        </p>
      </div>
    </div>
  );
}
