import gtoData from "@/data/gto-ghost.json";

type Row = {
  spot: string;
  combo: string;
  raise: number;
  call: number;
  fold: number;
};

const userFreq: Record<string, { raise: number; call: number; fold: number }> = {
  A5s: { raise: 58, call: 34, fold: 8 },
  KQo: { raise: 20, call: 52, fold: 28 },
  "76s": { raise: 22, call: 56, fold: 22 },
  QTs: { raise: 50, call: 34, fold: 16 },
};

function diffLabel(value: number) {
  if (Math.abs(value) <= 5) return "LOCKED";
  return value > 0 ? `+${value}` : `${value}`;
}

export default function GtoGhostPage() {
  const parsed = gtoData as Row[];

  return (
    <section className="space-y-4">
      <div className="tech-panel p-5">
        <p className="jp-deco text-xs text-on-surface-variant">ゴースト グリッド</p>
        <h1 className="mt-2 text-4xl font-black">The GTO Ghost</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Lightweight JSON parsed. Grid compares your line vs solved output.
        </p>
      </div>

      <div className="overflow-x-auto tech-panel">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="jp-deco text-[11px] tracking-[0.16em] text-on-surface-variant">
            <tr className="border-b border-outline-variant">
              <th className="px-3 py-3 text-left">スポット</th>
              <th className="px-3 py-3 text-left">ハンド</th>
              <th className="px-3 py-3 text-left">レイズ</th>
              <th className="px-3 py-3 text-left">コール</th>
              <th className="px-3 py-3 text-left">フォルド</th>
              <th className="px-3 py-3 text-left">サ</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map((row, idx) => {
              const user = userFreq[row.combo] ?? { raise: 0, call: 0, fold: 100 };
              const delta = row.raise - user.raise;
              return (
                <tr
                  key={`${row.spot}-${row.combo}`}
                  className={idx % 2 === 0 ? "bg-surface-container-low/60" : "bg-surface-container/70"}
                >
                  <td className="px-3 py-3 text-on-surface-variant">{row.spot}</td>
                  <td className="px-3 py-3 font-display text-on-surface">{row.combo}</td>
                  <td className="px-3 py-3 text-on-surface">{row.raise}% / you {user.raise}%</td>
                  <td className="px-3 py-3 text-on-surface-variant">{row.call}% / you {user.call}%</td>
                  <td className="px-3 py-3 text-on-surface-variant">{row.fold}% / you {user.fold}%</td>
                  <td className={`px-3 py-3 font-display ${Math.abs(delta) <= 5 ? "score-good" : "score-bad"}`}>
                    {diffLabel(delta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
