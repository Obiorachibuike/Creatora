import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { auth } from "@/auth";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) redirect("/");
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <SignUpForm />
    </div>
  );
}
