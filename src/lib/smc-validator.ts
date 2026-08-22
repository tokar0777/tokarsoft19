export type Verdict = "CONFIRMED" | "INVALIDATED" | "HIGH RISK";

export type SmcAnalysis = {
  structure: string[];
  liquidity: string[];
  priceAction: string[];
  verdict: Verdict;
  summary: string;
};

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const STRUCTURE = [
  [
    "HTF (Daily) delivering bearish — last displacement broke the prior weekly low.",
    "H4 shows a clean BOS to the downside; no bullish ChoCh printed yet.",
    "M15 internal structure aligned with the HTF draw on liquidity.",
  ],
  [
    "HTF (Daily) bullish — series of higher highs with protected swing lows intact.",
    "H1 ChoCh confirmed after the sweep, shifting delivery to the upside.",
    "M5 internal structure is bullish but stretched into an equal-high zone.",
  ],
  [
    "HTF trend is indecisive — Daily is consolidating inside the previous week's range.",
    "H4 shows overlapping structure; no valid BOS in either direction.",
    "LTF ChoCh present, but against the dominant HTF delivery.",
  ],
];

const LIQUIDITY = [
  [
    "External liquidity: previous session high swept before the displacement leg.",
    "Internal liquidity (equal highs) remains untouched above — likely draw.",
    "Sell-side liquidity resting under the Asian low is the nearest objective.",
  ],
  [
    "No liquidity sweep preceded this move — the leg is unengineered.",
    "Buy-side liquidity sits directly above entry, price is likely to expand into it first.",
    "Relative equal lows below make the stop placement vulnerable.",
  ],
  [
    "Asian range low swept in the London killzone, classic Judas behaviour.",
    "External liquidity taken, internal liquidity now the target.",
    "SMT divergence against the correlated pair supports the sweep.",
  ],
];

const PRICE_ACTION = [
  [
    "Valid M15 FVG left behind by the displacement leg; entry sits in its upper third.",
    "Origin order block is unmitigated and coincides with the FVG.",
    "Price is in a discount of the dealing range (below 50% equilibrium).",
  ],
  [
    "The FVG has already been fully rebalanced — no fresh imbalance to trade from.",
    "Entry is deep in premium (above 70% of the dealing range).",
    "Nearest order block is third-touch and low quality.",
  ],
  [
    "Breaker block formed after the failed swing and is being retested cleanly.",
    "Small inefficiency remains inside the POI, giving a tight invalidation.",
    "Premium/discount is neutral — price sits near equilibrium.",
  ],
];

const SUMMARIES: Record<Verdict, string> = {
  CONFIRMED:
    "Liquidity was engineered and taken, structure shifted with displacement, and the POI is unmitigated in the correct half of the dealing range. This idea satisfies the model — execute with the planned invalidation and let the draw on liquidity play out.",
  "HIGH RISK":
    "The narrative is partially there, but at least one core element is weak: either the sweep is not clean, the POI has been touched, or price is not in the right premium/discount zone. Reduce size or wait for a lower-timeframe confirmation before committing.",
  INVALIDATED:
    "The idea does not meet Smart Money criteria: no engineered liquidity ahead of the move, structure is against the HTF draw, and the point of interest offers no fresh imbalance. Stand aside — this is a legacy-TA style entry, not an SMC entry.",
};

export function analyzeSmc(seed: string): SmcAnalysis {
  const h = hash(seed || "default");
  const pick = h % 3;
  const verdict: Verdict = pick === 0 ? "CONFIRMED" : pick === 2 ? "HIGH RISK" : "INVALIDATED";

  return {
    structure: STRUCTURE[pick]!,
    liquidity: LIQUIDITY[pick]!,
    priceAction: PRICE_ACTION[pick]!,
    verdict,
    summary: SUMMARIES[verdict],
  };
}
