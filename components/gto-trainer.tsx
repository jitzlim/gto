"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  equity,
  heroBest as calcHeroBest,
  gtoDecision,
  randomScenario,
  type GTODecision,
  type Scenario,
  type Street,
} from "@/lib/poker-engine";

// ─── Types ────────────────────────────────────────────────────────────

export type GlyphStyle = "classic" | "geo" | "mono";
export type PanelTone = "light" | "dark";
export type CardAnim = "flip" | "slide" | "fade" | "pop";
export type Variant = "classic" | "portrait" | "studio";

interface HistoryEntry {
  hero: string[];
  board: string[];
  eq: number;
  need: number;
  gto: string;
  user: string;
  correct: boolean;
  street: Street;
  ts: number;
}

interface Feedback {
  correct: boolean;
  verdict: string;
  msg: string;
  userAction: string;
  gtoAction: string;
}

// ─── Suit glyphs ─────────────────────────────────────────────────────

const isRed = (suit: string) => suit === "h" || suit === "d";

function SuitGlyph({ suit, style, color }: { suit: string; style: GlyphStyle; color: string }) {
  if (style === "geo") {
    if (suit === "c") {
      return (
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <circle cx="12" cy="8" r="4" fill="none" stroke={color} strokeWidth="1.6" />
          <circle cx="7" cy="15" r="4" fill="none" stroke={color} strokeWidth="1.6" />
          <circle cx="17" cy="15" r="4" fill="none" stroke={color} strokeWidth="1.6" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <polygon points="12,3 21,12 12,21 3,12" fill="none" stroke={color} strokeWidth="1.6" />
      </svg>
    );
  }
  if (style === "mono") {
    if (suit === "s") return <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 3 L20 13 Q20 18 14 18 L14 21 L10 21 L10 18 Q4 18 4 13 Z" fill="currentColor" /></svg>;
    if (suit === "h") return <svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21 C12 21 4 14 4 9 C4 6 6 4 8 4 C10 4 12 6 12 8 C12 6 14 4 16 4 C18 4 20 6 20 9 C20 14 12 21 12 21 Z" fill="currentColor" /></svg>;
    if (suit === "d") return <svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,3 20,12 12,21 4,12" fill="currentColor" /></svg>;
    return (
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <circle cx="12" cy="8" r="4" fill="currentColor" />
        <circle cx="7" cy="15" r="4" fill="currentColor" />
        <circle cx="17" cy="15" r="4" fill="currentColor" />
        <rect x="11" y="14" width="2" height="6" fill="currentColor" />
      </svg>
    );
  }
  // classic
  const sym: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
  return <span style={{ fontFamily: "serif", fontSize: "0.9em", color }}>{sym[suit]}</span>;
}

// ─── Card ─────────────────────────────────────────────────────────────

interface CardProps {
  card?: string;
  glyphStyle?: GlyphStyle;
  anim?: CardAnim;
  delay?: number;
  size?: "sm" | "md" | "lg";
}

function Card({ card, glyphStyle = "classic", anim = "flip", delay = 0, size = "md" }: CardProps) {
  const sizes = {
    sm: { w: 48, h: 68, fz: 14, glyphSize: 18 },
    md: { w: 80, h: 112, fz: 22, glyphSize: 32 },
    lg: { w: 96, h: 134, fz: 26, glyphSize: 40 },
  };
  const s = sizes[size];

  if (!card) {
    return <div className={`gto-card gto-card-${size} gto-card-empty`} style={{ width: s.w, height: s.h }} />;
  }

  const rank = card[0] === "T" ? "10" : card[0];
  const suit = card[1];
  const color = isRed(suit) ? "#c0392b" : "#1a1a1a";

  const animStyle: Record<CardAnim, React.CSSProperties> = {
    flip: { animation: `gtoCardFlipIn 0.5s ${delay}ms backwards cubic-bezier(.5,.0,.3,1.2)` },
    slide: { animation: `gtoCardSlideIn 0.4s ${delay}ms backwards ease-out` },
    fade: { animation: `gtoCardFadeIn 0.6s ${delay}ms backwards ease-out` },
    pop: { animation: `gtoCardPop 0.45s ${delay}ms backwards cubic-bezier(.3,1.6,.5,1)` },
  };

  return (
    <div className={`gto-card gto-card-${size}`} style={{ width: s.w, height: s.h, ...animStyle[anim] }}>
      <div className="gto-card-corner gto-card-corner-tl" style={{ color }}>
        <div className="gto-card-rank" style={{ fontSize: s.fz }}>{rank}</div>
        <div className="gto-card-suit-sm" style={{ width: s.glyphSize * 0.55, height: s.glyphSize * 0.55, color }}>
          <SuitGlyph suit={suit} style={glyphStyle} color={color} />
        </div>
      </div>
      <div className="gto-card-center" style={{ width: s.glyphSize, height: s.glyphSize, color }}>
        <SuitGlyph suit={suit} style={glyphStyle} color={color} />
      </div>
      <div className="gto-card-corner gto-card-corner-br" style={{ color }}>
        <div className="gto-card-rank" style={{ fontSize: s.fz }}>{rank}</div>
      </div>
    </div>
  );
}

// ─── LED readout ──────────────────────────────────────────────────────

function LedReadout({ value, suffix = "%", tone = "light", width = 84 }: {
  value: string | number;
  suffix?: string;
  tone?: PanelTone;
  width?: number;
}) {
  return (
    <div className={`gto-led ${tone === "dark" ? "gto-led-dark" : ""}`} style={{ width }}>
      <span className="gto-led-text">{value}{suffix}</span>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────

function ActionBtn({ children, onClick, accent, hot = false, disabled, hotkey }: {
  children: React.ReactNode;
  onClick?: () => void;
  accent?: string;
  hot?: boolean;
  disabled?: boolean;
  hotkey?: string;
}) {
  return (
    <button
      className={`gto-btn ${hot ? "gto-btn-hot" : ""}`}
      onClick={onClick}
      disabled={disabled}
      style={hot && accent ? { background: accent, color: "#fff", borderColor: accent } : undefined}
    >
      <span className="gto-btn-label">{children}</span>
      {hotkey && <span className="gto-btn-hotkey">{hotkey}</span>}
    </button>
  );
}

// ─── Performance ring ─────────────────────────────────────────────────

function PerformanceRing({ correct, total, size = 56, accent = "#d9583a" }: {
  correct: number;
  total: number;
  size?: number;
  accent?: string;
}) {
  const pct = total > 0 ? correct / total : 0;
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={accent} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

// ─── Difficulty pills ─────────────────────────────────────────────────

function DifficultyPills({ value, onChange, tone = "light" }: {
  value: Street;
  onChange: (s: Street) => void;
  tone?: PanelTone | "dark";
}) {
  const opts: Street[] = ["preflop", "flop", "turn", "river"];
  return (
    <div className={`gto-diff ${tone === "dark" ? "gto-diff-dark" : ""}`}>
      {opts.map(o => (
        <button
          key={o}
          className={`gto-diff-pill ${value === o ? "gto-diff-active" : ""}`}
          onClick={() => onChange(o)}
        >{o.toUpperCase()}</button>
      ))}
    </div>
  );
}

// ─── Meter pair ───────────────────────────────────────────────────────

function MeterPair({ eqDisplay, oddsDisplay, equity: eq, potOdds, accent, tone = "light", compact, channels }: {
  eqDisplay: string | number;
  oddsDisplay: number;
  equity: number;
  potOdds: number;
  accent: string;
  tone?: PanelTone | "dark";
  compact?: boolean;
  channels?: boolean;
}) {
  const eqPct = Math.max(0, Math.min(1, eq));
  const oddsPct = Math.max(0, Math.min(1, potOdds));
  const ahead = eqPct >= oddsPct;
  const dark = tone === "dark";

  return (
    <div className={`gto-meter-pair ${dark ? "gto-meter-pair-dark" : ""} ${compact ? "gto-meter-pair-compact" : ""}`}>
      <div className="gto-meter-row">
        <div className="gto-meter-head">
          {channels && <span className="gto-mono gto-meter-ch">CH·1</span>}
          <span className="gto-meter-label">EQUITY</span>
        </div>
        <LedReadout value={eqDisplay} suffix="%" tone={dark ? "dark" : "light"} width={compact ? 72 : 88} />
        <div className="gto-meter-track">
          <div className="gto-meter-fill" style={{ width: `${eqPct * 100}%`, background: ahead ? accent : "#888" }} />
          {[25, 50, 75].map(p => <div key={p} className="gto-meter-tick" style={{ left: `${p}%` }} />)}
          <div className="gto-meter-threshold" style={{ left: `${oddsPct * 100}%` }}>
            <div className="gto-meter-threshold-flag" />
          </div>
        </div>
      </div>

      <div className="gto-meter-row">
        <div className="gto-meter-head">
          {channels && <span className="gto-mono gto-meter-ch">CH·2</span>}
          <span className="gto-meter-label">POT ODDS</span>
        </div>
        <LedReadout value={oddsDisplay} suffix="%" tone={dark ? "dark" : "light"} width={compact ? 72 : 88} />
        <div className="gto-meter-track gto-meter-track-muted">
          <div className="gto-meter-fill" style={{ width: `${oddsPct * 100}%`, background: dark ? "#999" : "#666" }} />
          {[25, 50, 75].map(p => <div key={p} className="gto-meter-tick" style={{ left: `${p}%` }} />)}
        </div>
      </div>

      <div className={`gto-meter-verdict ${ahead ? "ahead" : "behind"}`}>
        <span className="gto-mono">Δ</span>
        <span className="gto-mono">{ahead ? "+" : ""}{Math.round((eq - potOdds) * 100)} pts</span>
        <span className="gto-meter-verdict-label">{ahead ? "ahead of threshold" : "short of threshold"}</span>
      </div>
    </div>
  );
}

// ─── Readout terminal ─────────────────────────────────────────────────

function ReadoutTerminal({ feedback, decision, equity: eq, scenario, heroBestStr, tone = "light" }: {
  feedback: Feedback | null;
  decision: GTODecision | null;
  equity: number | null;
  scenario: Scenario;
  heroBestStr: string;
  tone?: PanelTone | "dark";
}) {
  const lines: Array<{ label: string; text: string; muted?: boolean; hot?: boolean; good?: boolean }> = [];

  if (!eq || !decision) {
    lines.push({ label: "> ", text: "Calculating equity...", muted: true });
  } else if (!feedback) {
    lines.push({ label: "> ", text: `${heroBestStr}. Equity ${(decision.eq * 100).toFixed(0)}% vs pot odds ${(decision.need * 100).toFixed(0)}%.`, muted: true });
    lines.push({ label: "? ", text: `Pot $${scenario.pot}, bet $${scenario.bet}. What's your move?` });
  } else {
    lines.push({
      label: feedback.correct ? "✓ " : "✗ ",
      text: feedback.correct
        ? `CORRECT — you chose ${feedback.userAction}`
        : `WRONG — you chose ${feedback.userAction}, GTO says ${feedback.gtoAction}`,
      hot: !feedback.correct,
      good: feedback.correct,
    });
    lines.push({ label: "  ", text: feedback.msg });
    lines.push({ label: "↵ ", text: "Press SPACE / NEW HAND to continue.", muted: true });
  }

  return (
    <div className={`gto-terminal ${tone === "dark" ? "gto-terminal-dark" : ""}`}>
      {lines.map((l, i) => (
        <div key={i} className={`gto-term-line ${l.muted ? "muted" : ""} ${l.hot ? "hot" : ""} ${l.good ? "good" : ""}`}>
          <span className="gto-term-prefix">{l.label}</span>
          <span>{l.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Mini card (history) ──────────────────────────────────────────────

function MiniCard({ card }: { card: string }) {
  const r = card[0] === "T" ? "10" : card[0];
  const s = card[1];
  const red = s === "h" || s === "d";
  const sym: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
  return (
    <span className="gto-mini-card" style={{ color: red ? "#c0392b" : "#1a1a1a" }}>
      {r}{sym[s]}
    </span>
  );
}

// ─── History panel ────────────────────────────────────────────────────

function HistoryPanel({ history, onClose, tone = "light" }: {
  history: HistoryEntry[];
  onClose: () => void;
  tone?: PanelTone | "dark";
}) {
  return (
    <div className={`gto-history ${tone === "dark" ? "gto-history-dark" : ""}`}>
      <div className="gto-history-head">
        <span>HAND HISTORY · {history.length}</span>
        <button onClick={onClose} className="gto-history-close">×</button>
      </div>
      <div className="gto-history-body">
        {history.length === 0 ? (
          <div className="gto-history-empty">No hands yet — play to record history.</div>
        ) : history.map((h, i) => (
          <div key={i} className={`gto-history-row ${h.correct ? "ok" : "bad"}`}>
            <span className="gto-h-marker">{h.correct ? "✓" : "✗"}</span>
            <div className="gto-h-cards">
              {h.hero.map((c, j) => <MiniCard key={j} card={c} />)}
              <span className="gto-h-sep">|</span>
              {h.board.map((c, j) => <MiniCard key={j} card={c} />)}
            </div>
            <span className="gto-h-stat">{(h.eq * 100).toFixed(0)}% / {(h.need * 100).toFixed(0)}%</span>
            <span className="gto-h-action">
              <span className={h.correct ? "" : "gto-h-wrong"}>{h.user}</span>
              {!h.correct && <span className="gto-h-gto"> → {h.gto}</span>}
            </span>
            <span className="gto-h-street">{h.street.slice(0, 1).toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Classic layout ───────────────────────────────────────────────────

function ClassicLayout({ scenario, eqDisplay, oddsDisplay, feedback, stats, difficulty, onDifficulty, onAction, onNew, accent, glyphStyle, panelTone, cardAnim, scenarioId, eq, decision, heroBestStr, history, showHistory, setShowHistory }: LayoutProps) {
  return (
    <div className={`gto-panel gto-panel-classic ${panelTone === "dark" ? "gto-panel-dark" : ""}`}>
      <div className="gto-grain" />
      <div className="gto-header">
        <div className="gto-header-left">
          <PerformanceRing correct={stats.correct} total={stats.total} accent={accent} size={48} />
          <div className="gto-header-stats">
            <div className="gto-header-stats-num">{stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0}%</div>
            <div className="gto-header-stats-label">{stats.correct}/{stats.total}</div>
          </div>
        </div>
        <div className="gto-header-center">
          <div className="gto-title">GTO TRAINER</div>
          <div className="gto-subtitle">— flop trainer · v1.0 —</div>
        </div>
        <div className="gto-header-right">
          <button className="gto-history-btn" onClick={() => setShowHistory(s => !s)}>LOG · {history.length}</button>
          <DifficultyPills value={difficulty} onChange={onDifficulty} />
        </div>
      </div>

      <div className="gto-body">
        <div className="gto-cards-zone">
          <div className="gto-cards-section">
            <div className="gto-section-label">THE BOARD</div>
            <div className="gto-cards-row" key={`board-${scenarioId}`}>
              {Array.from({ length: 5 }).map((_, i) => {
                const c = scenario.board[i];
                return c
                  ? <Card key={`${scenarioId}-b-${i}`} card={c} glyphStyle={glyphStyle} anim={cardAnim} delay={i * 80} size="md" />
                  : <Card key={i} size="md" />;
              })}
            </div>
          </div>
          <div className="gto-cards-section">
            <div className="gto-section-label">YOUR HAND · <span style={{ opacity: 0.6 }}>{heroBestStr}</span></div>
            <div className="gto-cards-row" key={`hero-${scenarioId}`}>
              {scenario.hero.map((c, i) => (
                <Card key={`${scenarioId}-h-${i}`} card={c} glyphStyle={glyphStyle} anim={cardAnim} delay={400 + i * 100} size="md" />
              ))}
            </div>
          </div>
        </div>

        <div className="gto-knobs-zone">
          <div className="gto-knob-bezel">
            <MeterPair eqDisplay={eqDisplay} oddsDisplay={oddsDisplay} equity={eq ?? 0} potOdds={scenario.potOdds} accent={accent} />
            <div className="gto-knob-divider" />
            <div className="gto-pot-info">
              <div className="gto-pot-row"><span>POT</span><span className="gto-mono">${scenario.pot}</span></div>
              <div className="gto-pot-row"><span>TO CALL</span><span className="gto-mono">${scenario.bet}</span></div>
              <div className="gto-pot-row"><span>STREET</span><span className="gto-mono">{scenario.street.toUpperCase()}</span></div>
            </div>
          </div>
        </div>
      </div>

      <ReadoutTerminal feedback={feedback} decision={decision} equity={eq} scenario={scenario} heroBestStr={heroBestStr} />

      <div className="gto-actions">
        <ActionBtn onClick={() => onAction("FOLD")} disabled={!!feedback} hotkey="F">FOLD</ActionBtn>
        <ActionBtn onClick={() => onAction("CALL")} disabled={!!feedback} hotkey="C">CALL</ActionBtn>
        <ActionBtn onClick={() => onAction("RAISE")} disabled={!!feedback} hot accent={accent} hotkey="R">RAISE</ActionBtn>
        <ActionBtn onClick={() => onNew()} hotkey="␣">{feedback ? "NEW HAND" : "SKIP"}</ActionBtn>
      </div>

      <div className="gto-screw gto-screw-tl" />
      <div className="gto-screw gto-screw-tr" />
      <div className="gto-screw gto-screw-bl" />
      <div className="gto-screw gto-screw-br" />

      {showHistory && <HistoryPanel history={history} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

// ─── Portrait layout ──────────────────────────────────────────────────

function PortraitLayout({ scenario, eqDisplay, oddsDisplay, feedback, stats, difficulty, onDifficulty, onAction, onNew, accent, glyphStyle, panelTone, cardAnim, scenarioId, eq, decision, heroBestStr, history, showHistory, setShowHistory }: LayoutProps) {
  return (
    <div className={`gto-panel gto-panel-portrait ${panelTone === "dark" ? "gto-panel-dark" : ""}`}>
      <div className="gto-grain" />

      <div className="gto-p-header">
        <div className="gto-p-title">GTO TRAINER</div>
        <div className="gto-p-perf">
          <PerformanceRing correct={stats.correct} total={stats.total} accent={accent} size={36} />
          <span className="gto-mono" style={{ fontSize: 12 }}>{stats.correct}/{stats.total}</span>
        </div>
      </div>

      <DifficultyPills value={difficulty} onChange={onDifficulty} />

      <div className="gto-p-board">
        <div className="gto-section-label">THE BOARD · <span style={{ opacity: 0.6 }}>{heroBestStr}</span></div>
        <div className="gto-cards-row gto-p-board-row" key={`board-${scenarioId}`}>
          {Array.from({ length: 5 }).map((_, i) => {
            const c = scenario.board[i];
            return c
              ? <Card key={`${scenarioId}-b-${i}`} card={c} glyphStyle={glyphStyle} anim={cardAnim} delay={i * 60} size="sm" />
              : <Card key={i} size="sm" />;
          })}
        </div>
      </div>

      <div className="gto-p-hero-zone">
        <div className="gto-p-hero">
          <div className="gto-section-label">YOUR HAND</div>
          <div className="gto-cards-row" key={`hero-${scenarioId}`}>
            {scenario.hero.map((c, i) => (
              <Card key={`${scenarioId}-h-${i}`} card={c} glyphStyle={glyphStyle} anim={cardAnim} delay={300 + i * 80} size="md" />
            ))}
          </div>
        </div>
        <div className="gto-p-meters">
          <MeterPair eqDisplay={eqDisplay} oddsDisplay={oddsDisplay} equity={eq ?? 0} potOdds={scenario.potOdds} accent={accent} compact />
        </div>
      </div>

      <div className="gto-p-pot">
        <span>POT <b>${scenario.pot}</b></span>
        <span>BET <b>${scenario.bet}</b></span>
        <span>{scenario.street.toUpperCase()}</span>
        <button className="gto-history-btn" onClick={() => setShowHistory(s => !s)}>LOG·{history.length}</button>
      </div>

      <ReadoutTerminal feedback={feedback} decision={decision} equity={eq} scenario={scenario} heroBestStr={heroBestStr} />

      <div className="gto-actions">
        <ActionBtn onClick={() => onAction("FOLD")} disabled={!!feedback} hotkey="F">FOLD</ActionBtn>
        <ActionBtn onClick={() => onAction("CALL")} disabled={!!feedback} hotkey="C">CALL</ActionBtn>
        <ActionBtn onClick={() => onAction("RAISE")} disabled={!!feedback} hot accent={accent} hotkey="R">RAISE</ActionBtn>
      </div>
      <button className="gto-next-btn" onClick={() => onNew()}>{feedback ? "↵ NEW HAND" : "SKIP →"}</button>

      <div className="gto-screw gto-screw-tl" />
      <div className="gto-screw gto-screw-tr" />
      <div className="gto-screw gto-screw-bl" />
      <div className="gto-screw gto-screw-br" />

      {showHistory && <HistoryPanel history={history} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

// ─── Studio layout ────────────────────────────────────────────────────

function StudioLayout({ scenario, eqDisplay, oddsDisplay, feedback, stats, difficulty, onDifficulty, onAction, onNew, accent, glyphStyle, cardAnim, scenarioId, eq, decision, heroBestStr, history, showHistory, setShowHistory }: LayoutProps) {
  return (
    <div className="gto-panel gto-panel-studio">
      <div className="gto-grain" />

      <div className="gto-s-rail">
        <div className="gto-s-rail-cluster">
          <div className="gto-s-led-tiny gto-s-led-on" />
          <span className="gto-mono gto-s-rail-text">REC</span>
        </div>
        <div className="gto-s-rail-title">
          <span className="gto-s-title">GTO/TRAINER</span>
          <span className="gto-s-tag">— STUDIO MODE —</span>
        </div>
        <div className="gto-s-rail-cluster">
          <span className="gto-mono gto-s-rail-text">{stats.total} HANDS</span>
          <PerformanceRing correct={stats.correct} total={stats.total} accent={accent} size={36} />
          <span className="gto-mono gto-s-rail-text" style={{ fontSize: 18 }}>{stats.total > 0 ? Math.round(stats.correct / stats.total * 100) : 0}%</span>
        </div>
      </div>

      <div className="gto-s-grid">
        <div className="gto-s-cards">
          <div className="gto-s-cards-head">
            <div className="gto-section-label" style={{ color: "#999" }}>BOARD · {scenario.street.toUpperCase()}</div>
            <DifficultyPills value={difficulty} onChange={onDifficulty} tone="dark" />
          </div>
          <div className="gto-cards-row" key={`board-${scenarioId}`}>
            {Array.from({ length: 5 }).map((_, i) => {
              const c = scenario.board[i];
              return c
                ? <Card key={`${scenarioId}-b-${i}`} card={c} glyphStyle={glyphStyle} anim={cardAnim} delay={i * 70} size="md" />
                : <Card key={i} size="md" />;
            })}
          </div>
          <div className="gto-section-label" style={{ marginTop: 24, color: "#999" }}>HERO · <span style={{ opacity: 0.7 }}>{heroBestStr}</span></div>
          <div className="gto-cards-row" key={`hero-${scenarioId}`}>
            {scenario.hero.map((c, i) => (
              <Card key={`${scenarioId}-h-${i}`} card={c} glyphStyle={glyphStyle} anim={cardAnim} delay={400 + i * 100} size="lg" />
            ))}
          </div>
        </div>

        <div className="gto-s-meters">
          <MeterPair eqDisplay={eqDisplay} oddsDisplay={oddsDisplay} equity={eq ?? 0} potOdds={scenario.potOdds} accent={accent} tone="dark" channels />
          <div className="gto-s-pot">
            <div className="gto-s-pot-row"><span>POT</span><span className="gto-mono">${scenario.pot}</span></div>
            <div className="gto-s-pot-row"><span>BET</span><span className="gto-mono">${scenario.bet}</span></div>
            <button className="gto-history-btn gto-history-btn-dark" onClick={() => setShowHistory(s => !s)}>LOG · {history.length}</button>
          </div>
        </div>
      </div>

      <ReadoutTerminal feedback={feedback} decision={decision} equity={eq} scenario={scenario} heroBestStr={heroBestStr} tone="dark" />

      <div className="gto-actions gto-actions-dark">
        <ActionBtn onClick={() => onAction("FOLD")} disabled={!!feedback} hotkey="F">FOLD</ActionBtn>
        <ActionBtn onClick={() => onAction("CALL")} disabled={!!feedback} hotkey="C">CALL</ActionBtn>
        <ActionBtn onClick={() => onAction("RAISE")} disabled={!!feedback} hot accent={accent} hotkey="R">RAISE</ActionBtn>
        <ActionBtn onClick={() => onNew()} hotkey="␣">{feedback ? "NEW HAND" : "SKIP"}</ActionBtn>
      </div>

      <div className="gto-screw gto-screw-tl gto-screw-dark" />
      <div className="gto-screw gto-screw-tr gto-screw-dark" />
      <div className="gto-screw gto-screw-bl gto-screw-dark" />
      <div className="gto-screw gto-screw-br gto-screw-dark" />

      {showHistory && <HistoryPanel history={history} onClose={() => setShowHistory(false)} tone="dark" />}
    </div>
  );
}

// ─── Shared layout props ──────────────────────────────────────────────

interface LayoutProps {
  scenario: Scenario;
  eqDisplay: string | number;
  oddsDisplay: number;
  feedback: Feedback | null;
  stats: { correct: number; total: number };
  difficulty: Street;
  onDifficulty: (s: Street) => void;
  onAction: (act: "FOLD" | "CALL" | "RAISE") => void;
  onNew: () => void;
  accent: string;
  glyphStyle: GlyphStyle;
  panelTone: PanelTone;
  cardAnim: CardAnim;
  scenarioId: number;
  eq: number | null;
  decision: GTODecision | null;
  heroBestStr: string;
  history: HistoryEntry[];
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
}

// ─── Main GTOTrainer component ────────────────────────────────────────

export interface GTOTrainerProps {
  variant?: Variant;
  glyphStyle?: GlyphStyle;
  panelTone?: PanelTone;
  accent?: string;
  cardAnim?: CardAnim;
  defaultDifficulty?: Street;
}

export function GTOTrainer({
  variant = "classic",
  glyphStyle = "classic",
  panelTone = "light",
  accent = "#d9583a",
  cardAnim = "flip",
  defaultDifficulty = "flop",
}: GTOTrainerProps) {
  const [difficulty, setDifficulty] = useState<Street>(defaultDifficulty);
  const [scenario, setScenario] = useState<Scenario>(() => randomScenario(defaultDifficulty));
  const [eq, setEq] = useState<number | null>(null);
  const [decision, setDecision] = useState<GTODecision | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [scenarioId, setScenarioId] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setEq(null);
    setDecision(null);
    setFeedback(null);
    const timer = setTimeout(() => {
      const e = equity(scenario.hero, scenario.board, 700);
      const d = gtoDecision({
        heroEquity: e,
        potOdds: scenario.potOdds,
        street: scenario.street,
        pot: scenario.pot,
        bet: scenario.bet,
      });
      setEq(e);
      setDecision(d);
    }, 50);
    return () => clearTimeout(timer);
  }, [scenarioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const newHand = useCallback((diff: Street = difficulty) => {
    setScenario(randomScenario(diff));
    setScenarioId(id => id + 1);
  }, [difficulty]);

  const changeDifficulty = (d: Street) => {
    setDifficulty(d);
    setScenario(randomScenario(d));
    setScenarioId(id => id + 1);
  };

  const handleAction = useCallback((act: "FOLD" | "CALL" | "RAISE") => {
    if (!decision || feedback) return;
    const correct = act === decision.action;
    let coachMsg: string;
    if (correct) {
      coachMsg = `Good read. ${decision.why}`;
    } else {
      const eqPct = (decision.eq * 100).toFixed(0);
      const needPct = (decision.need * 100).toFixed(0);
      if (decision.action === "FOLD" && (act === "CALL" || act === "RAISE")) {
        coachMsg = `Slow down. The bet asks you to win ${needPct}%, but you only have ${eqPct}%. Folding here protects your stack.`;
      } else if (decision.action === "CALL" && act === "FOLD") {
        coachMsg = `Too tight. Your ${eqPct}% equity beats the ${needPct}% threshold — calling is +EV. Don't fold winning math.`;
      } else if (decision.action === "CALL" && act === "RAISE") {
        coachMsg = `Easy. Your edge (${eqPct}% vs ${needPct}%) is real but thin. Raising bloats the pot when you're only slightly ahead. Just call.`;
      } else if (decision.action === "RAISE" && act === "FOLD") {
        coachMsg = `You folded a monster. ${eqPct}% equity vs ${needPct}% needed — this is a value spot. Get the chips in.`;
      } else if (decision.action === "RAISE" && act === "CALL") {
        coachMsg = `Underplaying. You're crushing the math (${eqPct}% vs ${needPct}%). When you're this far ahead, build the pot. Raise.`;
      } else {
        coachMsg = decision.why;
      }
    }
    setFeedback({ correct, verdict: correct ? "CORRECT" : "INCORRECT", msg: coachMsg, userAction: act, gtoAction: decision.action });
    setStats(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setHistory(h => [{
      hero: scenario.hero,
      board: scenario.board,
      eq: decision.eq,
      need: decision.need,
      gto: decision.action,
      user: act,
      correct,
      street: scenario.street,
      ts: Date.now(),
    }, ...h].slice(0, 24));
  }, [decision, feedback, scenario]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") handleAction("FOLD");
      else if (e.key === "c" || e.key === "C") handleAction("CALL");
      else if (e.key === "r" || e.key === "R") handleAction("RAISE");
      else if ((e.key === "n" || e.key === "N" || e.key === " ") && feedback) {
        e.preventDefault();
        newHand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAction, feedback, newHand]);

  const eqDisplay = eq !== null ? Math.round(eq * 100) : "--";
  const oddsDisplay = Math.round(scenario.potOdds * 100);
  const heroBestStr = useMemo(() => calcHeroBest(scenario.hero, scenario.board), [scenarioId]); // eslint-disable-line react-hooks/exhaustive-deps

  const layoutProps: LayoutProps = {
    scenario, eqDisplay, oddsDisplay, feedback, stats, difficulty,
    onDifficulty: changeDifficulty, onAction: handleAction, onNew: newHand,
    accent, glyphStyle, panelTone, cardAnim, scenarioId,
    eq, decision, heroBestStr, history, showHistory, setShowHistory,
  };

  if (variant === "portrait") return <PortraitLayout {...layoutProps} />;
  if (variant === "studio") return <StudioLayout {...layoutProps} />;
  return <ClassicLayout {...layoutProps} />;
}
