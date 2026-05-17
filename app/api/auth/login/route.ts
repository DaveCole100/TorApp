import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, users, tenantMembers } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "אימייל או סיסמה שגויים" }, { status: 401 });
    }

    // Get tenant
    const [member] = await db.select().from(tenantMembers).where(eq(tenantMembers.userId, user.id)).limit(1);

    const session = await getSession();
    session.userId    = user.id;
    session.tenantId  = member?.tenantId ?? "";
    session.role      = member?.role ?? "owner";
    session.name      = user.fullName ?? email;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true, hasTenant: !!member });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
