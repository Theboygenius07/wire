import { createUser, getUserByEmail } from "@/lib/auth/users";
import { hashPassword } from "@/lib/auth/passwords";
import { startSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body with email and password." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return Response.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash);
  if (!user) {
    return Response.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  await startSession(user);
  return Response.json({ email: user.email });
}
