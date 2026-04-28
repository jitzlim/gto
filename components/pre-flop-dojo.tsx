"use client";

import { useMemo, useState } from "react";
import { actionLabel, type Action, preFlopScenarios } from "@/lib/preflop";
import { useTiltLock } from "@/providers/tilt-lock-provider";

type ResultState = {
  correct: boolean;
  text: string;
};

const SWIPE_THRESHOLD = 80;

function nextIndex(current: number) {
  if (preFlopScenarios.length === 0) return 0;
  return (current + 1) % preFlopScenarios.length;
}

export function PreFlopDojo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [result, setResult] = useState<ResultState | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const { isLocked, reportDrillResult } = useTiltLock();

  const scenario = preFlopScenarios[scenarioIndex];

  const hintAction = useMemo(() => {
    if (dragX <= -SWIPE_THRESHOLD) return "fold";
    if (dragX >= SWIPE_THRESHOLD) return "raise";
    return "call";
  }, [dragX]);

  const resolveAction = (picked: Action) => {
    if (isLocked) return;

    const isCorrect = picked === scenario.optimal;
    reportDrillResult(isCorrect);
    setResult({
      correct: isCorrect,
      text: isCorrect
        ? `${scenario.message}`
        : `Math beats ego. ${actionLabel[scenario.optimal]} was right.`,
    });

    if (isCorrect) {
      setCorrectCount((count) => count + 1);
    } else {
      setWrongCount((count) => count + 1);
    }

    setDragStartX(null);
    setDragX(0);
    window.setTimeout(() => {
      setScenarioIndex((index) => nextIndex(index));
      setResult(null);
    }, 460);
  };

  return (
    <section className="space-y-6">
      <div className="tech-panel p-4">
        <p className="jp-deco text-xs text-on-surface-variant">ドージョー テンポ</p>
        <h1 className="mt-2 text-4xl font-black text-on-surface">The Pre-Flop Dojo</h1>
        <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
          Swipe left = fold. Swipe right = raise. Middle click = call.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div
          className="swipe-card tech-panel select-none p-6"
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
            borderColor:
              hintAction === "raise"
                ? "var(--toxic-green)"
                : hintAction === "fold"
                  ? "var(--cyber-pink)"
                  : "var(--primary)",
          }}
          onPointerDown={(event) => {
            if (isLocked) return;
            setDragStartX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (dragStartX === null || isLocked) return;
            setDragX(event.clientX - dragStartX);
          }}
          onPointerUp={() => {
            if (dragStartX === null || isLocked) return;
            const picked: Action =
              dragX <= -SWIPE_THRESHOLD ? "fold" : dragX >= SWIPE_THRESHOLD ? "raise" : "call";
            resolveAction(picked);
          }}
          onPointerLeave={() => {
            if (dragStartX === null || isLocked) return;
            const picked: Action =
              dragX <= -SWIPE_THRESHOLD ? "fold" : dragX >= SWIPE_THRESHOLD ? "raise" : "call";
            resolveAction(picked);
          }}
          onAuxClick={(event) => {
            if (event.button === 1) {
              event.preventDefault();
              resolveAction("call");
            }
          }}
        >
          <p className="jp-deco text-xs text-on-surface-variant">ネオン ハンド</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Position</p>
              <p className="mt-1 text-5xl font-black text-on-surface">{scenario.position}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Hand</p>
              <p className="mt-1 text-5xl font-black text-on-surface">{scenario.hand}</p>
            </div>
          </div>

          <div className="mt-10 grid gap-2 text-xs uppercase tracking-[0.16em] md:grid-cols-3">
            <p className="border border-outline-variant p-2 text-on-surface-variant">Left: Fold</p>
            <p className="border border-outline-variant p-2 text-on-surface-variant">Middle: Call</p>
            <p className="border border-outline-variant p-2 text-on-surface-variant">Right: Raise</p>
          </div>

          {result && (
            <p className={`mt-4 text-sm font-semibold ${result.correct ? "score-good" : "score-bad"}`}>
              {result.text}
            </p>
          )}
        </div>

        <aside className="tech-panel space-y-4 p-4">
          <p className="jp-deco text-xs text-on-surface-variant">リザルト</p>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Clean Hits</p>
            <p className="text-4xl font-black text-toxic-green">{correctCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Misses</p>
            <p className="text-4xl font-black text-cyber-pink">{wrongCount}</p>
          </div>
          <p className="text-xs text-on-surface-variant">No excuses. Make one clear move each hand.</p>
        </aside>
      </div>
    </section>
  );
}
