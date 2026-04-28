export type Position = "UTG" | "HJ" | "CO" | "BTN" | "SB" | "BB";
export type Action = "fold" | "call" | "raise";

export type PreFlopScenario = {
  id: string;
  hand: string;
  position: Position;
  optimal: Action;
  message: string;
};

export const preFlopScenarios: PreFlopScenario[] = [
  {
    id: "utg-72o",
    hand: "7♣ 2♦",
    position: "UTG",
    optimal: "fold",
    message: "Trash hand. You are under the gun. Fold it.",
  },
  {
    id: "btn-a5s",
    hand: "A♠ 5♠",
    position: "BTN",
    optimal: "raise",
    message: "Button edge. Raise and print pressure.",
  },
  {
    id: "co-kqo",
    hand: "K♦ Q♣",
    position: "CO",
    optimal: "raise",
    message: "Strong enough in cut-off. Raise now.",
  },
  {
    id: "bb-99-vs-open",
    hand: "9♥ 9♣",
    position: "BB",
    optimal: "call",
    message: "Pocket pair in big blind. Call and see a flop.",
  },
  {
    id: "sb-q8o",
    hand: "Q♠ 8♦",
    position: "SB",
    optimal: "fold",
    message: "Out of position with noise. Fold.",
  },
];

export const actionLabel: Record<Action, string> = {
  fold: "Fold",
  call: "Call",
  raise: "Raise",
};
