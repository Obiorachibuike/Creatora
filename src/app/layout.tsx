import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Creatora — Create Beyond Imagination",
  description:
    "Creatora is an AI-powered creative production platform: AI video, image, voice and music tools plus a professional multitrack editor.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-(--background) font-(--font-sans) text-(--foreground)">
        <Nav />
        <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8">{children}</div>
        <footer className="border-t border-(--border) py-6 text-center text-xs text-(--foreground-muted)">
          Creatora — AI Creative Production Platform · Coded for you by the Arena Agent
        </footer>
      </body>
    </html>
  );
}
