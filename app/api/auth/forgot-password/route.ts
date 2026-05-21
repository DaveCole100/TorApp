import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

const SECRET = process.env.SESSION_SECRET ?? "torapp-secret-key-min-32-chars-long!!";

function makeToken(email: string): string {
  const exp = Date.now() + 3_600_000; // 1 hour
  const payload = Buffer.from(`${email}:${exp}`).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "אימייל נדרש" }, { status: 400 });

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    // Don't reveal if email exists
    if (!user) return NextResponse.json({ ok: true });

    const token = makeToken(email.toLowerCase().trim());
    const base  = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const resetUrl = `${base}/reset-password?token=${token}`;

    // TODO: send email in production. For now, return the link directly.
    return NextResponse.json({ ok: true, resetUrl });
  } catch {
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
