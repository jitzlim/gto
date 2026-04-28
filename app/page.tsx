import Link from "next/link";

const modules = [
  {
    href: "/gto-trainer",
    title: "GTO Trainer",
    detail: "Random spots, equity readout, coach feedback. Three panel layouts.",
  },
  {
    href: "/dojo/pre-flop",
    title: "The Pre-Flop Dojo",
    detail: "Rapid swipe drill by hand + seat.",
  },
  {
    href: "/equity-engine",
    title: "The Equity Engine",
    detail: "Pot-odds math under a hard clock.",
  },
  {
    href: "/aggression-test",
    title: "The Aggression Test",
    detail: "Type exact post-flop bet size %.",
  },
  {
    href: "/gto-ghost",
    title: "The GTO Ghost",
    detail: "Compare your line vs solved frequencies.",
  },
];

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="tech-panel p-6">
        <p className="jp-deco text-xs text-on-surface-variant">ネオン ラボ</p>
        <h1 className="mt-2 text-5xl font-black text-on-surface">High-Speed Poker Lab</h1>
        <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">
          Fast drills. Hard feedback. No fluff.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="tech-panel group p-5 transition hover:border-neon-green"
          >
            <p className="jp-deco text-xs text-on-surface-variant">モジュール</p>
            <h2 className="mt-2 text-2xl font-black text-on-surface group-hover:text-neon-green">
              {module.title}
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">{module.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
