import { cookies } from "next/headers";
import { verifyToken, SessionPayload } from "./jwt";

export const AUTH_COOKIE_NAME = "rudra_auth_token";

export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function requireAuth(): Promise<SessionPayload> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN_ADMIN_ONLY");
  }
  return user;
}

export async function requireApprovedResident(): Promise<SessionPayload> {
  const user = await requireAuth();
  if (user.role !== "resident" && user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  if (user.role === "resident" && user.status === "pending_approval") {
    throw new Error("APPROVAL_PENDING");
  }
  return user;
}
