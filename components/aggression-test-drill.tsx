"use client";

import { useState } from "react";
import { useTiltLock } from "@/providers/tilt-lock-provider";

const spots = [
  {
    board: "K♠ 7♦ 2♣",
    pot: 60,
    optimalPct: 33,
    note: "Dry board. Small stab works.",
  },
  {
    board: "J♥ T♥ 9♠",
    pot: 90,
    optimalPct: 75,
    note: "Wet board. Push value and deny draws.",
  },
];

export function AggressionTestDrill() {
  const [index, setIndex] = useState(0);
  const [betPct, setBetPct] = useState("");
  const [feedback, setFeedback] = useState("");
  const { isLocked, reportDrillResult } = useTiltLock();

  const spot = spots[index];

  return (
    <section className="space-y-4">
      <div className="tech-panel p-5">
        <p className="jp-deco text-xs text-on-surface-variant">アグロ テスト</p>
        <h1 className="mt-2 text-4xl font-black">The Aggression Test</h1>
      </div>

      <div className="tech-panel space-y-4 p-5">
        <p className="text-sm text-on-surface-variant">Board: {spot.board}</p>
        <p className="text-sm text-on-surface-variant">Pot: {spot.pot}</p>
        <p className="text-sm text-on-surface-variant">Enter exact bet %.</p>

        <div className="flex flex-wrap gap-2">
          <input
            className="w-40 border border-outline bg-surface-container-lowest px-3 py-2 font-display"
            value={betPct}
            onChange={(event) => setBetPct(event.target.value)}
            placeholder="ex: 33"
            disabled={isLocked}
          />
          <button
            className="border border-neon-green px-3 py-2 text-sm font-semibold text-neon-green"
            disabled={isLocked}
            onClick={() => {
              const picked = Number(betPct.replace("%", ""));
              const pass = picked === spot.optimalPct;
              reportDrillResult(pass);
              setFeedback(
                pass
                  ? `Sharp sizing. ${spot.note}`
                  : `Off line. Solver wanted ${spot.optimalPct}%.`,
              );
              setBetPct("");
              setIndex((value) => (value + 1) % spots.length);
            }}
          >
            Lock Size
          </button>
        </div>

        {feedback && (
          <p className={feedback.startsWith("Sharp") ? "score-good text-sm" : "score-bad text-sm"}>
            {feedback}
          </p>
        )}
      </div>
    </section>
  );
}
