import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { auth } from "@/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <SignInForm />
    </div>
  );
}
