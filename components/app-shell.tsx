"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTiltLock } from "@/providers/tilt-lock-provider";

const moduleLinks = [
  { href: "/dojo/pre-flop", label: "The Pre-Flop Dojo" },
  { href: "/equity-engine", label: "The Equity Engine" },
  { href: "/aggression-test", label: "The Aggression Test" },
  { href: "/gto-ghost", label: "The GTO Ghost" },
];

function linkClasses(isActive: boolean) {
  return [
    "rounded-md border px-3 py-2 text-xs uppercase tracking-[0.18em] transition",
    isActive
      ? "border-neon-green text-neon-green"
      : "border-outline-variant text-on-surface-variant hover:border-silver hover:text-silver",
  ].join(" ");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { failStreak, isLocked, secondsLeft } = useTiltLock();

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pb-8 pt-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-15"
      >
        <p className="watermark-text absolute -left-4 top-20 rotate-[-16deg] text-[82px]">
          ドージョー ドージョー
        </p>
        <p className="watermark-text absolute bottom-24 right-[-4rem] rotate-[14deg] text-[72px]">
          データ ネオン データ
        </p>
      </div>

      <header className="relative z-10 mb-8 grid gap-5 border border-outline-variant bg-surface-container-low px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-2xl font-black uppercase tracking-[0.06em] text-on-surface">
            Poker Trainer
          </Link>
          <p className="rounded-sm border border-outline-variant px-3 py-2 text-xs uppercase tracking-[0.18em] text-on-surface-variant">
            Tilt Stack: {failStreak}/3
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {moduleLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={linkClasses(isActive)}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      {isLocked && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/88 p-6">
          <div className="max-w-md border border-cyber-pink bg-surface-container px-8 py-7 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-cyber-pink">ティルト ロック</p>
            <p className="mt-3 text-4xl font-black text-on-surface">{secondsLeft}s</p>
            <p className="mt-4 text-sm text-on-surface-variant">
              You missed 3 in a row. Breathe. Reset your head.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
