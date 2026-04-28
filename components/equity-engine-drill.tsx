"use client";

import { useEffect, useMemo, useState } from "react";
import { useTiltLock } from "@/providers/tilt-lock-provider";

type Drill = {
  outs: number;
  pot: number;
  call: number;
};

const drills: Drill[] = [
  { outs: 9, pot: 120, call: 40 },
  { outs: 8, pot: 90, call: 30 },
  { outs: 15, pot: 200, call: 80 },
];

function calcPct(drill: Drill) {
  return Math.round((drill.call / (drill.pot + drill.call)) * 100);
}

export function EquityEngineDrill() {
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(12);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const { isLocked, reportDrillResult } = useTiltLock();

  const drill = drills[index];
  const needed = useMemo(() => calcPct(drill), [drill]);

  useEffect(() => {
    if (isLocked) return;
    const timer = window.setTimeout(() => {
      setSeconds((value) => {
        if (value <= 1) {
          reportDrillResult(false);
          setFeedback(`Clock hit zero. You needed ${needed}% to call.`);
          setAnswer("");
          setIndex((spotIndex) => (spotIndex + 1) % drills.length);
          return 12;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isLocked, needed, reportDrillResult, seconds]);

  return (
    <section className="space-y-4">
      <div className="tech-panel p-5">
        <p className="jp-deco text-xs text-on-surface-variant">エクイティ エンジン</p>
        <h1 className="mt-2 text-4xl font-black">The Equity Engine</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Timer placeholder: {seconds}s</p>
      </div>

      <div className="tech-panel space-y-4 p-5">
        <p className="text-sm text-on-surface-variant">
          Pot is {drill.pot}. Villain bets {drill.call}. How much equity do you need?
        </p>
        <p className="text-sm text-on-surface-variant">Draw outs: {drill.outs}</p>

        <div className="flex flex-wrap gap-2">
          <input
            className="w-40 border border-outline bg-surface-container-lowest px-3 py-2 font-display"
            placeholder="Type %"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={isLocked}
          />
          <button
            className="border border-neon-green px-3 py-2 text-sm font-semibold text-neon-green"
            disabled={isLocked}
            onClick={() => {
              const picked = Number(answer.replace("%", ""));
              const pass = Math.abs(picked - needed) <= 2;
              reportDrillResult(pass);
              setFeedback(
                pass
                  ? "Clean math. You can call."
                  : `Math does not care. You needed ${needed}% to call.`,
              );
              setAnswer("");
              setSeconds(12);
              setIndex((value) => (value + 1) % drills.length);
            }}
          >
            Check
          </button>
        </div>

        {feedback && (
          <p className={feedback.startsWith("Clean") ? "score-good text-sm" : "score-bad text-sm"}>
            {feedback}
          </p>
        )}
      </div>
    </section>
  );
}
