"use client";

import { useState, useEffect } from "react";

export default function WhatsAppMockup() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowAlert(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto max-w-sm">
      {/* Phone frame */}
      <div className="bg-stone-900 rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-[#e5ddd5] rounded-[2rem] overflow-hidden h-[600px] relative">
          {/* WhatsApp header */}
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <div>
              <p className="font-semibold text-sm">BillBachat</p>
              <p className="text-xs text-emerald-200">online</p>
            </div>
            <div className="ml-auto text-lg">⋮</div>
          </div>

          {/* Chat area */}
          <div className="p-3 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100% - 60px)" }}>
            {/* Date */}
            <div className="text-center">
              <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
                Aaj
              </span>
            </div>

            {showAlert && (
              <div className="whatsapp-bubble p-3 max-w-[85%] animate-slideUp shadow-sm">
                <p className="text-sm font-bold text-stone-800 mb-2">
                  ⚠️ Slab Alert
                </p>
                <p className="text-sm text-stone-700 mb-2">
                  <span className="font-bold">195 units</span> used. Sirf <span className="font-bold text-red-600">5 baaki!</span>
                </p>
                <div className="bg-red-50 rounded-lg p-2 my-2">
                  <p className="text-sm font-bold text-red-600">
                    Rs. 4,200 → Rs. 7,800
                  </p>
                  <p className="text-xs text-stone-500">5 aur units = double!</p>
                </div>
                <p className="text-sm font-semibold text-stone-800 mb-1">
                  💡 Save:
                </p>
                <p className="text-sm text-stone-700 mb-1">
                  1️⃣ AC 1hr band (−3 units)
                </p>
                <p className="text-sm text-stone-700 mb-1">
                  2️⃣ Geyser band (−2 units)
                </p>
                <p className="text-xs text-stone-400 text-right mt-2">
                  2:00 PM ✓✓
                </p>
              </div>
            )}

            {/* Second message */}
            <div className="whatsapp-bubble p-3 max-w-[70%] animate-slideUp shadow-sm" style={{ animationDelay: "0.8s" }}>
              <p className="text-sm text-stone-700">
                ✅ AC band kar diya!
              </p>
              <p className="text-xs text-stone-400 text-right mt-1">2:01 PM ✓✓</p>
            </div>

            {/* BillBachat reply */}
            <div className="bg-emerald-100 rounded-[2px] rounded-tr-2xl rounded-bl-2xl p-3 max-w-[75%] ml-auto animate-slideUp shadow-sm" style={{ animationDelay: "1.5s" }}>
              <p className="text-sm text-stone-700">
                🎉 Rs. 3,600 bacha liye! Bill: Rs. 4,200 ✅
              </p>
              <p className="text-xs text-stone-400 text-right mt-1">2:02 PM ✓✓</p>
            </div>
          </div>

          {/* Input bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#f0f0f0] p-2 flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full px-4 py-2">
              <span className="text-sm text-stone-400">Message</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#075e54] flex items-center justify-center text-white">
              ➤
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
