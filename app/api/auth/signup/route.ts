import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, users, tenantMembers, tenants } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "פרטים חסרים או סיסמה קצרה מדי" }, { status: 400 });
    }

    // Check if email exists
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing) {
      return NextResponse.json({ error: "האימייל כבר רשום במערכת" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      fullName: fullName?.trim() || null,
    }).returning();

    const session = await getSession();
    session.userId    = user.id;
    session.tenantId  = "";
    session.role      = "owner";
    session.name      = user.fullName ?? email;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: any) {
    console.error("signup error", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
