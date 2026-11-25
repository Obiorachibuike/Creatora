"use server";

import { signIn } from "@/auth";
import { createAccount } from "@/lib/auth-utils";

export type SignInResult = { ok: boolean; error?: string };

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "invalid_credentials" };
  }
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await createAccount({ email, password, name });
  if (!user) {
    return { ok: false, error: "email_or_password_invalid" };
  }
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch {
    // account created; return ok so the user can try signing in again
  }
  return { ok: true };
}
