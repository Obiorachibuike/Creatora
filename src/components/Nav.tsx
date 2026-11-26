import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/Button";

export async function Nav() {
  const session = await auth();
  return (
    <header className="border-b border-(--border) bg-(--surface)">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="text-xl font-semibold text-(--brand-primary)">
          Creatora
        </Link>
        <ul className="flex gap-6">
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/video-studio">AI Video</NavLink>
          <NavLink href="/voice-studio">Voice Studio</NavLink>
          <NavLink href="/exports">Exports</NavLink>
          <NavLink href="/ai-assistant">Assistant</NavLink>
          {session?.user?.email && await isAdmin(session.user.email) ? <NavLink href="/admin">Admin</NavLink> : null}
        </ul>
        <div className="ml-auto flex items-center gap-3">
          {session ? (
            <>
              <span className="hidden text-sm md:block">
                {session?.user?.name ?? session?.user?.email ?? ""}
              </span>
              <form
                action={async () => {
                  await signOut();
                }}
              >
                <Button size="sm" variant="outline">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

async function isAdmin(email: string) {
  const row = await db.select({ role: users.role }).from(users).where(eq(users.email, email)).limit(1);
  return row[0]?.role === "admin";
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm font-medium text-(--foreground-muted) hover:text-(--brand-primary)"
      >
        {children}
      </Link>
    </li>
  );
}
