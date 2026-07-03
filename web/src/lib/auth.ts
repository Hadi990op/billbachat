/**
 * BillBachat Auth — Phone-based, JWT, JSON file storage
 * 
 * Users stored in /opt/baal-agent/workspace/billbachat/whatsapp-bot/users.json
 * No passwords — phone number is the identity (like WhatsApp itself).
 * 
 * Flow:
 *   1. User enters phone number + name on signup page
 *   2. Server creates user in users.json, returns JWT
 *   3. JWT stored in localStorage, sent with API calls
 *   4. Server verifies JWT, checks plan, gates features
 */

import jwt from "jsonwebtoken";
import { promises as fs } from "fs";
import path from "path";

const JWT_SECRET =
  process.env.JWT_SECRET || "billbachat-secret-2026-change-in-production";
const USERS_FILE = path.join(
  "/opt/baal-agent/workspace/billbachat/whatsapp-bot",
  "users.json"
);

export interface User {
  phone: string; // 92XXXXXXXXXX (international format)
  phoneDisplay: string; // 0XXXXXXXXXX (local display)
  name: string;
  plan: "free" | "pro" | "family";
  planExpiry: string | null; // ISO date or null
  createdAt: string;
  billChecksToday: number;
  lastCheckDate: string; // YYYY-MM-DD
  refNos: { refNo: string; company: string; label?: string }[]; // saved bills (family = multiple)
}

export interface UserDB {
  [phone: string]: User;
}

// === DB OPERATIONS ===

export async function loadUsers(): Promise<UserDB> {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function saveUsers(db: UserDB): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(db, null, 2));
}

export async function getUser(phone: string): Promise<User | null> {
  const db = await loadUsers();
  return db[phone] || null;
}

export async function createUser(
  phoneDisplay: string,
  name: string
): Promise<User> {
  const db = await loadUsers();

  // Normalize phone: 03XXXXXXXXX -> 92XXXXXXXXX
  let phone = phoneDisplay.replace(/[^\d]/g, "");
  if (phone.startsWith("0")) phone = "92" + phone.slice(1);
  if (phone.length === 10) phone = "92" + phone;

  // Check if already exists
  if (db[phone]) {
    return db[phone];
  }

  const today = new Date().toISOString().split("T")[0];
  const user: User = {
    phone,
    phoneDisplay: phoneDisplay,
    name: name.trim() || "User",
    plan: "free",
    planExpiry: null,
    createdAt: new Date().toISOString(),
    billChecksToday: 0,
    lastCheckDate: today,
    refNos: [],
  };

  db[phone] = user;
  await saveUsers(db);
  return user;
}

// === JWT ===

export function createToken(user: User): string {
  return jwt.sign(
    { phone: user.phone, name: user.name, plan: user.plan },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token: string): {
  phone: string;
  name: string;
  plan: string;
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      phone: string;
      name: string;
      plan: string;
    };
  } catch {
    return null;
  }
}

// === PLAN GATING ===

export function isPlanActive(user: User): boolean {
  if (user.plan === "free") return true; // free is always "active"
  if (!user.planExpiry) return false;
  return new Date(user.planExpiry) > new Date();
}

export function getEffectivePlan(user: User): "free" | "pro" | "family" {
  if (!isPlanActive(user)) return "free";
  return user.plan;
}

// Free tier: 1 bill check per day
export function canCheckBill(user: User): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split("T")[0];
  const plan = getEffectivePlan(user);

  if (plan === "free") {
    // Reset daily counter
    if (user.lastCheckDate !== today) {
      return { allowed: true, remaining: 1 };
    }
    const remaining = Math.max(0, 1 - user.billChecksToday);
    return { allowed: remaining > 0, remaining };
  }

  // Pro and Family: unlimited
  return { allowed: true, remaining: -1 }; // -1 = unlimited
}

export async function incrementBillCheck(phone: string): Promise<void> {
  const db = await loadUsers();
  const user = db[phone];
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];
  if (user.lastCheckDate !== today) {
    user.billChecksToday = 0;
    user.lastCheckDate = today;
  }
  user.billChecksToday++;
  db[phone] = user;
  await saveUsers(db);
}

export async function upgradePlan(
  phone: string,
  plan: "pro" | "family",
  months: number = 1
): Promise<User | null> {
  const db = await loadUsers();
  const user = db[phone];
  if (!user) return null;

  user.plan = plan;
  // Set expiry: current expiry + months, or today + months
  const base = user.planExpiry && new Date(user.planExpiry) > new Date()
    ? new Date(user.planExpiry)
    : new Date();
  base.setMonth(base.getMonth() + months);
  user.planExpiry = base.toISOString();

  db[phone] = user;
  await saveUsers(db);
  return user;
}

export async function addRefNo(
  phone: string,
  refNo: string,
  company: string,
  label?: string
): Promise<void> {
  const db = await loadUsers();
  const user = db[phone];
  if (!user) return;

  const plan = getEffectivePlan(user);
  const maxRefs = plan === "family" ? 5 : plan === "pro" ? 3 : 1;

  // Check if ref already exists
  const exists = user.refNos.find((r) => r.refNo === refNo);
  if (exists) return;

  if (user.refNos.length >= maxRefs) {
    // Free: replace the single ref. Pro/Family: don't add beyond limit
    if (plan === "free") {
      user.refNos = [{ refNo, company, label }];
    }
    return;
  }

  user.refNos.push({ refNo, company, label });
  db[phone] = user;
  await saveUsers(db);
}

// Helper to get auth from request
export function getAuthFromRequest(req: Request): {
  phone: string;
  name: string;
  plan: string;
} | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  return verifyToken(token);
}
