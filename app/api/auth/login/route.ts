import { getUserByEmail } from "@/lib/auth/users";
import { verifyPassword } from "@/lib/auth/passwords";
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
  if (!email || !password) {
    return Response.json({ error: "Missing email or password." }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  const valid = user && (await verifyPassword(password, user.passwordHash));
  if (!user || !valid) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await startSession(user);
  return Response.json({ email: user.email });
}
