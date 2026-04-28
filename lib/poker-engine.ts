// Poker engine — deck, hand eval, equity Monte Carlo, GTO heuristic

const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'] as const;
const SUITS = ['s','h','d','c'] as const;

export type Rank = typeof RANKS[number];
export type Suit = typeof SUITS[number];
export type Card = string;
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

const RANK_VAL: Record<string, number> = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]));

export function freshDeck(): Card[] {
  const d: Card[] = [];
  for (const r of RANKS) for (const s of SUITS) d.push(`${r}${s}`);
  return d;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rank5(cards: string[]): number {
  const vals = cards.map(c => RANK_VAL[c[0]]).sort((a, b) => b - a);
  const suits = cards.map(c => c[1]);
  const flush = suits.every(s => s === suits[0]);
  const uniq = [...new Set(vals)];
  let straight = false, straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) { straight = true; straightHigh = uniq[0]; }
    if (uniq.join(',') === '14,5,4,3,2') { straight = true; straightHigh = 5; }
  }
  const counts: Record<number, number> = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([v, c]) => [+v, c] as [number, number])
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const pattern = groups.map(g => g[1]).join('');
  let cat = 1;
  let kickers = groups.map(g => g[0]);
  if (straight && flush) { cat = 9; kickers = [straightHigh]; }
  else if (pattern === '41') cat = 8;
  else if (pattern === '32') cat = 7;
  else if (flush) { cat = 6; kickers = vals; }
  else if (straight) { cat = 5; kickers = [straightHigh]; }
  else if (pattern === '311') cat = 4;
  else if (pattern === '221') cat = 3;
  else if (pattern === '2111') cat = 2;
  let score = cat * 1e10;
  for (let i = 0; i < kickers.length && i < 5; i++) {
    score += kickers[i] * Math.pow(15, 4 - i);
  }
  return score;
}

function bestOf7(cards: string[]): number {
  if (cards.length < 5) return rank5(cards.concat(cards.slice(0, 5 - cards.length)));
  let best = 0;
  const n = cards.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++)
        for (let l = k + 1; l < n; l++)
          for (let m = l + 1; m < n; m++) {
            const r = rank5([cards[i], cards[j], cards[k], cards[l], cards[m]]);
            if (r > best) best = r;
          }
  return best;
}

export function equity(hero: string[], board: string[], iters = 600): number {
  const used = new Set([...hero, ...board]);
  const remaining = freshDeck().filter(c => !used.has(c));
  let wins = 0, ties = 0;
  for (let i = 0; i < iters; i++) {
    const pool = shuffle(remaining);
    const villain = [pool[0], pool[1]];
    const extra: string[] = [];
    let idx = 2;
    while (board.length + extra.length < 5) extra.push(pool[idx++]);
    const fullBoard = board.concat(extra);
    const heroScore = bestOf7(hero.concat(fullBoard));
    const villScore = bestOf7(villain.concat(fullBoard));
    if (heroScore > villScore) wins++;
    else if (heroScore === villScore) ties++;
  }
  return (wins + ties / 2) / iters;
}

export function heroBest(hero: string[], board: string[]): string {
  if (board.length === 0) {
    if (hero[0][0] === hero[1][0]) return `Pair of ${hero[0][0]}s`;
    return 'High Card';
  }
  const all = hero.concat(board);
  let best = 0;
  const n = all.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++)
        for (let l = k + 1; l < n; l++)
          for (let m = l + 1; m < n; m++) {
            const r = rank5([all[i], all[j], all[k], all[l], all[m]]);
            if (r > best) best = r;
          }
  const cat = Math.floor(best / 1e10);
  const names = ['','High Card','Pair','Two Pair','Three of a Kind','Straight','Flush','Full House','Quads','Straight Flush'];
  return names[cat] ?? 'High Card';
}

export type GTODecision = {
  action: 'FOLD' | 'CALL' | 'RAISE';
  why: string;
  eq: number;
  need: number;
  margin: number;
};

export function gtoDecision({ heroEquity, potOdds }: {
  heroEquity: number;
  potOdds: number;
  street: Street;
  pot: number;
  bet: number;
}): GTODecision {
  const need = potOdds;
  const eq = heroEquity;
  const margin = eq - need;
  let action: 'FOLD' | 'CALL' | 'RAISE';
  let why: string;
  if (eq < need - 0.05) {
    action = 'FOLD';
    why = `Equity ${(eq * 100).toFixed(0)}% is well below the ${(need * 100).toFixed(0)}% needed. The math says fold — chasing burns chips.`;
  } else if (eq < need + 0.05) {
    action = 'CALL';
    why = `Equity ${(eq * 100).toFixed(0)}% just covers the ${(need * 100).toFixed(0)}% required. Marginal call — break-even at best, but no fold equity if you raise.`;
  } else if (eq < need + 0.20) {
    action = 'CALL';
    why = `Equity ${(eq * 100).toFixed(0)}% beats the ${(need * 100).toFixed(0)}% threshold by ${((eq - need) * 100).toFixed(0)} points. Call is +EV. Raise risks folding out worse hands.`;
  } else {
    action = 'RAISE';
    why = `Equity ${(eq * 100).toFixed(0)}% crushes the ${(need * 100).toFixed(0)}% threshold. You're ahead — extract value. Raise builds the pot while you have the edge.`;
  }
  return { action, why, eq, need, margin };
}

export type Scenario = {
  hero: string[];
  board: string[];
  pot: number;
  bet: number;
  potOdds: number;
  street: Street;
};

export function randomScenario(street: Street): Scenario {
  const deck = shuffle(freshDeck());
  const hero = [deck[0], deck[1]];
  const boardSize: Record<Street, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };
  const board = deck.slice(2, 2 + boardSize[street]);
  const pot = [40, 60, 80, 100, 120, 150][Math.floor(Math.random() * 6)];
  const betPct = [0.33, 0.5, 0.66, 0.75, 1.0][Math.floor(Math.random() * 5)];
  const bet = Math.round(pot * betPct);
  const potOdds = bet / (pot + bet * 2);
  return { hero, board, pot, bet, potOdds, street };
}
