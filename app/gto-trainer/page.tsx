"use client";

import { useState } from "react";
import { GTOTrainer, type Variant, type GlyphStyle, type PanelTone, type CardAnim } from "@/components/gto-trainer";

const ACCENT_PRESETS = ["#d9583a", "#1a1a1a", "#3d8b5f", "#3a6dd9", "#c91d56"];

export default function GTOTrainerPage() {
  const [variant, setVariant] = useState<Variant>("classic");
  const [glyphStyle, setGlyphStyle] = useState<GlyphStyle>("mono");
  const [panelTone, setPanelTone] = useState<PanelTone>("light");
  const [accent, setAccent] = useState("#d9583a");
  const [cardAnim, setCardAnim] = useState<CardAnim>("flip");

  return (
    <section className="space-y-4">
      {/* Page header */}
      <div className="tech-panel p-5">
        <p className="jp-deco text-xs text-on-surface-variant">GTO トレーナー</p>
        <h1 className="mt-2 text-4xl font-black">GTO Trainer</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Instrument-panel poker math. Random spots, equity readout, coach feedback.
        </p>
      </div>

      {/* Controls bar */}
      <div className="tech-panel p-4 flex flex-wrap gap-6 items-center">
        {/* Variant */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-widest text-on-surface-variant uppercase">Layout</span>
          <div className="flex gap-1">
            {(["classic", "portrait", "studio"] as Variant[]).map(v => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition-colors ${
                  variant === v
                    ? "bg-on-surface text-surface border-on-surface"
                    : "border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >{v.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Glyph */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-widest text-on-surface-variant uppercase">Glyphs</span>
          <div className="flex gap-1">
            {(["classic", "geo", "mono"] as GlyphStyle[]).map(g => (
              <button
                key={g}
                onClick={() => setGlyphStyle(g)}
                className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition-colors ${
                  glyphStyle === g
                    ? "bg-on-surface text-surface border-on-surface"
                    : "border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >{g.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Card animation */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-widest text-on-surface-variant uppercase">Card Anim</span>
          <div className="flex gap-1">
            {(["flip", "slide", "fade", "pop"] as CardAnim[]).map(a => (
              <button
                key={a}
                onClick={() => setCardAnim(a)}
                className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition-colors ${
                  cardAnim === a
                    ? "bg-on-surface text-surface border-on-surface"
                    : "border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >{a.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Panel tone */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-widest text-on-surface-variant uppercase">Panel</span>
          <div className="flex gap-1">
            {(["light", "dark"] as PanelTone[]).map(t => (
              <button
                key={t}
                onClick={() => setPanelTone(t)}
                className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition-colors ${
                  panelTone === t
                    ? "bg-on-surface text-surface border-on-surface"
                    : "border-outline-variant text-on-surface-variant hover:text-on-surface"
                }`}
              >{t.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] tracking-widest text-on-surface-variant uppercase">Accent</span>
          <div className="flex gap-2 items-center">
            {ACCENT_PRESETS.map(c => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                style={{ background: c }}
                className={`w-6 h-6 rounded cursor-pointer transition-all ${
                  accent === c ? "ring-2 ring-offset-1 ring-on-surface ring-offset-surface" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div className="ml-auto font-mono text-[10px] text-on-surface-variant tracking-wider opacity-60">
          KEYS · F=Fold · C=Call · R=Raise · SPACE=New hand
        </div>
      </div>

      {/* Trainer panel */}
      <div className={`flex ${variant === "portrait" ? "justify-center" : ""}`}>
        <GTOTrainer
          variant={variant}
          glyphStyle={glyphStyle}
          panelTone={panelTone}
          accent={accent}
          cardAnim={cardAnim}
        />
      </div>
    </section>
  );
}
