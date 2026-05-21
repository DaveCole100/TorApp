import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import bcrypt from "bcryptjs";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

const SECRET = process.env.SESSION_SECRET ?? "torapp-secret-key-min-32-chars-long!!";

function parseToken(token: string): string | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig     = token.slice(dot + 1);
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;
    const [email, expStr] = Buffer.from(payload, "base64url").toString().split(":");
    if (!email || Date.now() > Number(expStr)) return null;
    return email;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "סיסמה חייבת להיות לפחות 8 תווים" }, { status: 400 });
    }

    const email = parseToken(token);
    if (!email) {
      return NextResponse.json({ error: "הקישור לא תקין או פג תוקפו" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.email, email));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
