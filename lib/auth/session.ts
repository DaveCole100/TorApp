import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId:   string;
  tenantId: string;
  role:     string;
  name:     string;
  isLoggedIn: boolean;
}

export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? "torapp-secret-key-min-32-chars-long!!",
  cookieName: "torapp_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
}

export async function requireSession() {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  return session;
}
