export type Verdict = "CONFIRMED" | "INVALIDATED" | "HIGH RISK";

export type SmcAnalysis = {
  asset: string;
  session: string;
  bias: string;
  structure: string[];
  liquidity: string[];
  priceAction: string[];
  verdict: Verdict;
  summary: string;
  execution: {
    entry: string;
    stopLoss: string;
    target: string;
  };
};

export const CORE_ASSETS = ["EUR/USD", "GBP/USD", "XAU/USD"] as const;

const CRYPTO_HINTS = [
  "BTC", "XBT", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LTC",
  "USDT", "USDC", "CRYPTO", "BINANCE", "COINBASE", "BYBIT", "PERP",
];

export function isCryptoSymbol(input: string): boolean {
  const s = input.toUpperCase();
  return CRYPTO_HINTS.some((h) => s.includes(h));
}

/** Extract a trading symbol + timeframe from a TradingView chart URL. */
export function parseTradingViewUrl(url: string): { symbol: string | null; interval: string | null } {
  if (!url) return { symbol: null, interval: null };
  let symbol: string | null = null;
  let interval: string | null = null;
  try {
    const u = new URL(url);
    symbol = u.searchParams.get("symbol");
    interval = u.searchParams.get("interval");
    if (!symbol) {
      const m = u.pathname.match(/\/symbols\/([^/]+)/i);
      if (m?.[1]) symbol = decodeURIComponent(m[1]);
    }
  } catch {
    const m = url.match(/symbol=([^&]+)/i);
    if (m?.[1]) symbol = decodeURIComponent(m[1]);
  }
  if (symbol) {
    symbol = symbol.replace(/^[A-Z]+:/, "").toUpperCase();
    if (/^[A-Z]{6}$/.test(symbol)) symbol = `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
    if (/^XAUUSD$/.test(symbol)) symbol = "XAU/USD";
  }
  return { symbol, interval };
}

const LANG_NAME: Record<string, string> = {
  UA: "Ukrainian",
  RU: "Russian",
  EN: "English",
};

export function buildSystemPrompt(lang: string): string {
  return `You are the SMC/ICT Validator Engine for a professional trading terminal.
You evaluate trade ideas STRICTLY with Smart Money Concepts (ICT) logic. You never use indicators,
trendlines, RSI/MACD, Elliott waves or classical chart patterns — mention them only to reject them.

ASSET FILTER (hard rule):
- Core tradable assets: EUR/USD, GBP/USD, XAU/USD. GBP/JPY-style majors are acceptable only as secondary.
- Any crypto asset (BTC, ETH, SOL, any *USDT pair, any crypto exchange feed) MUST be graded
  "HIGH RISK" at best and normally "INVALIDATED", explicitly stating that crypto is filtered out by the
  trading rules due to low setup alignment with the model.

SESSION & TIME CONTEXT:
- Look for liquidity sweeps taken from Asian session highs/lows during the Frankfurt or early London session.
- Note the killzone (Asia / Frankfurt / London / NY AM / NY PM) the setup belongs to.

STRUCTURE:
- Determine HTF bias (Daily/4H/1H), then H4/H1 structure (BOS vs ChoCh), then local M15/M5 shift.
- The idea must align with the HTF draw on liquidity.

POI, PREMIUM/DISCOUNT:
- LONG: price MUST be in DISCOUNT (below 50% equilibrium of the dealing range) tapping an unmitigated
  bullish FVG or order block.
- SHORT: price MUST be in PREMIUM (above 50%) tapping an unmitigated bearish FVG or order block.
- Violation of the premium/discount rule => INVALIDATED or HIGH RISK.

LIQUIDITY:
- Confirm engineered liquidity: EQH/EQL, Asian high/low, session highs/lows, internal vs external sweeps,
  and name the draw on liquidity target.

VERDICT:
- CONFIRMED only when structure, engineered liquidity, and an unmitigated POI in the correct
  premium/discount half all align.
- HIGH RISK when the narrative is partial (mitigated POI, unclean sweep, neutral equilibrium, crypto).
- INVALIDATED when core ICT criteria fail.
- Always give a concrete execution recommendation: entry logic, stop-loss placement logic
  (beyond the swept liquidity / POI origin), and a 50%-TP / move-to-break-even management plan.

If a chart image is provided, read it: candles, swing points, ranges, marked zones, symbol and timeframe
in the top-left, and any drawings. If information is missing, say so explicitly instead of inventing it.

WRITE ALL OUTPUT TEXT IN ${LANG_NAME[lang] ?? "English"}. Keep the ICT terminology (BOS, ChoCh, FVG,
order block, premium/discount, liquidity) in its standard English form inside the translated sentences.

Reply with ONLY a JSON object, no markdown fence, matching exactly:
{
  "asset": string,
  "session": string,
  "bias": string,
  "structure": string[3-4],
  "liquidity": string[2-4],
  "priceAction": string[2-4],
  "verdict": "CONFIRMED" | "INVALIDATED" | "HIGH RISK",
  "summary": string,
  "execution": { "entry": string, "stopLoss": string, "target": string }
}`;
}

export function buildUserPrompt(input: {
  prompt: string;
  chartUrl?: string | null;
  symbol?: string | null;
  interval?: string | null;
}): string {
  const lines = [`Trader's request: ${input.prompt}`];
  if (input.chartUrl) lines.push(`TradingView URL: ${input.chartUrl}`);
  if (input.symbol) lines.push(`Symbol extracted from URL: ${input.symbol}`);
  if (input.interval) lines.push(`Chart interval from URL: ${input.interval}`);
  lines.push(`Current UTC time: ${new Date().toISOString()}`);
  lines.push("Validate this idea against the model and return the JSON object.");
  return lines.join("\n");
}

function asStringArray(v: unknown, fallback: string[]): string[] {
  if (Array.isArray(v)) {
    const out = v.map((x) => String(x)).filter(Boolean);
    if (out.length) return out;
  }
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return fallback;
}

export function parseAnalysis(raw: string): SmcAnalysis {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const data = JSON.parse(json) as Record<string, unknown>;

  const verdictRaw = String(data['verdict'] ?? "").toUpperCase();
  const verdict: Verdict =
    verdictRaw.includes("CONFIRM") ? "CONFIRMED"
    : verdictRaw.includes("HIGH") ? "HIGH RISK"
    : "INVALIDATED";

  const exec = (data['execution'] ?? {}) as Record<string, unknown>;

  return {
    asset: String(data['asset'] ?? "—"),
    session: String(data['session'] ?? "—"),
    bias: String(data['bias'] ?? "—"),
    structure: asStringArray(data['structure'], ["—"]),
    liquidity: asStringArray(data['liquidity'], ["—"]),
    priceAction: asStringArray(data['priceAction'], ["—"]),
    verdict,
    summary: String(data['summary'] ?? ""),
    execution: {
      entry: String(exec['entry'] ?? "—"),
      stopLoss: String(exec['stopLoss'] ?? exec['stop_loss'] ?? "—"),
      target: String(exec['target'] ?? "—"),
    },
  };
}

/** Hard enforcement of the crypto filter regardless of what the model returned. */
export function enforceAssetFilter(analysis: SmcAnalysis, hints: string[]): SmcAnalysis {
  const crypto = hints.filter(Boolean).some((h) => isCryptoSymbol(h));
  if (!crypto) return analysis;
  return {
    ...analysis,
    verdict: analysis.verdict === "INVALIDATED" ? "INVALIDATED" : "HIGH RISK",
  };
}
