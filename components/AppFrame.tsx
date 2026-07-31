"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Feed" },
  { href: "/saved", label: "收藏" },
  { href: "/profile", label: "我" }
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-sm items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">marketing brain</span>
            <span className="text-[11px] text-faint">v1.0</span>
          </Link>
          <nav className="flex items-center">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-card px-3 py-1.5 text-sm transition-colors ${
                    active ? "font-semibold text-ink underline decoration-line decoration-2 underline-offset-8" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-screen-sm px-5 pb-24 pt-6">{children}</main>
    </div>
  );
}
