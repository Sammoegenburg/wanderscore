import { SignJWT, jwtVerify } from "jose";
import { compareSync, hashSync } from "bcryptjs";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "wanderscore-dev-secret-change-me"
);

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

// In-memory store (swap for a real DB in production)
const users = new Map<string, User>();

// Seed demo account
users.set("demo@wanderscore.com", {
  id: "demo-001",
  email: "demo@wanderscore.com",
  name: "Demo Explorer",
  passwordHash: hashSync("wanderscore", 10),
  createdAt: new Date().toISOString(),
});

export function findUserByEmail(email: string): User | undefined {
  return users.get(email.toLowerCase());
}

export function createUser(email: string, name: string, password: string): User {
  const normalized = email.toLowerCase();
  if (users.has(normalized)) {
    throw new Error("User already exists");
  }
  const user: User = {
    id: `user-${Date.now()}`,
    email: normalized,
    name,
    passwordHash: hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.set(normalized, user);
  return user;
}

export function validatePassword(user: User, password: string): boolean {
  return compareSync(password, user.passwordHash);
}

export async function createToken(user: User): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { sub: string; email: string; name: string };
}
