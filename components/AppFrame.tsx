"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useBrain } from "@/components/BrainProvider";

const navLinks = [
  { href: "/", label: "Feed" },
  { href: "/saved", label: "收藏" },
  { href: "/profile", label: "我" }
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reset } = useBrain();

  function confirmReset() {
    if (window.confirm("重置会清空这台设备上的营销收藏和备注，确定继续吗？")) reset();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-sm items-center justify-between gap-2 px-5 py-4">
          <Link href="/" className="flex shrink-0 items-baseline gap-2">
            <span className="whitespace-nowrap font-serif text-lg font-semibold tracking-tight text-ink sm:text-xl">marketing brain</span>
            <span className="hidden text-[11px] text-faint sm:inline">v1.0</span>
          </Link>
          <div className="flex items-center">
            <nav className="flex items-center">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`whitespace-nowrap rounded-card px-2 py-1.5 text-sm transition-colors sm:px-3 ${
                      active ? "font-semibold text-ink underline decoration-line decoration-2 underline-offset-8" : "text-muted hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <button type="button" onClick={confirmReset} className="ml-1 inline-flex h-8 w-8 items-center justify-center text-faint hover:text-ink" aria-label="重置本地数据">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-screen-sm px-5 pb-24 pt-6">{children}</main>
    </div>
  );
}
