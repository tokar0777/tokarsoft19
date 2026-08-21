# QUANT TRADING HUB — SMC Trading Journal & Analytics Terminal

A dark, terminal-style trading journal for Smart Money Concepts (ICT) traders, with statistics, a trade log, a risk/setup manager, and an SMC validator bot.

## Design direction

- Deep charcoal base (#0B0E14), elevated panels, thin hairline borders, subtle grid texture.
- Neon green for Long/Win, red for Short/Loss, amber for break-even/high-risk.
- Monospace numerics (JetBrains Mono) + clean sans for text; tabular data reads like a trading terminal.
- All colors as semantic tokens in `src/styles.css` — no hardcoded color classes.

## Navigation

Persistent left sidebar (collapses to a bottom/drawer nav on mobile) with four routes:

- `/` Dashboard & Statistics
- `/journal` Trade Log
- `/validator` SMC AI Validator
- `/risk` Risk & Setup Management

## 1. Dashboard & Analytics

- Filter bar: asset category (All / Crypto / Forex / Metals) and timeframe (Weekly / Monthly / Quarterly / Yearly).
- Metric cards computed live from filtered trades: total trades, win rate %, total R realized, average R per trade, best performing pair and asset class.
- Charts (Recharts): cumulative equity curve in R over time, and a win/loss bar chart grouped by asset category.
- Empty states when no trades match a filter.

## 2. Trade Log

- "Add New Trade" modal form: date & time, asset category, pair, position (Long/Short), setup (dropdown from the Setups library), entry, stop loss, take profit, realized R:R, confluence notes, TradingView URL, outcome (Win/Loss/BE).
- History table: color-coded outcome and direction, setup tag chips, external TradingView link, edit and delete actions, sortable by date, filterable by category/outcome.
- Validation with zod + react-hook-form.

## 3. Risk & Setup Manager

- Risk Rules: editable list of personal money-management rules with checkboxes (e.g. max 1% risk per trade, max 2 losses per day) plus free-text notes.
- SMC Setups Library: create/edit/delete setups with a name, description, and a required-confluence checklist. Setups feed the trade form dropdown.

## 4. SMC Validator Bot

- Chat-style interface with an image drop zone (TradingView screenshots, previewed inline) and a TradingView URL input.
- Responses render in a fixed structured format: Market Structure (BOS / ChoCh / HTF trend), Liquidity (internal/external sweeps), Price Action & POI (FVG, order block, breaker, premium/discount), and Final Verdict (CONFIRMED / INVALIDATED / HIGH RISK) with a summary.
- Analysis is simulated for now: a deterministic mock engine producing realistic ICT-language output, wired behind a single function so a real model call can replace it later without UI changes.

## Data & persistence

Backend enabled via Lovable Cloud so trades, setups, and risk rules persist per user:

- `trades`, `setups`, `risk_rules` tables, each owned by `user_id`, RLS restricted to the owner, with grants for `authenticated` and `service_role`.
- Email/password auth with a simple sign-in screen; app routes sit behind an authenticated layout.
- Seed migration inserts a set of demo trades and setups so the dashboard and charts are populated on first view.

## Technical notes

- TanStack Start routes under `src/routes`, TanStack Query for reads/writes, shadcn components (dialog, table, tabs, select, form, checkbox, sonner toasts).
- Analytics computed client-side from the fetched trade set; R:R stored as a numeric so equity curve = cumulative sum.
- Per-route `head()` metadata with unique titles and descriptions.
