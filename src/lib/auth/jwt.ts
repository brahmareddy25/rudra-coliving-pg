import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rudra_coliving_default_secure_secret_key_123456";

export interface SessionPayload {
  userId: string;
  role: "admin" | "resident";
  mobile: string;
  name: string;
  status: "active" | "inactive" | "pending_approval";
}

export function signToken(payload: SessionPayload, expiresIn: SignOptions["expiresIn"] = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions);
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (error) {
    return null;
  }
}
