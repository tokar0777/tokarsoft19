# TOKARsoft19

Build a professional, dark-themed Trading Journal and Analytics Terminal named "QUANT TRADING HUB" optimized for Smart Money Concepts (SMC / ICT) traders.

### 1. GENERAL UI/UX & LAYOUT

- Modern dark mode interface (deep charcoal/black background `#0B0E14`, glowing green/red accents for Long/Short, clean typography).

- Responsive sidebar navigation with the following tabs:

  1. Dashboard / Statistics

  2. Trade Log (Journal)

  3. SMC AI Validator

  4. Risk & Setup Management

### 2. DASHBOARD & ANALYTICS MODULE

- Top Filter Bar: Switch view between Categories ("All", "Crypto", "Forex", "Metals") and Timeframes ("Weekly", "Monthly", "Quarterly", "Yearly").

- Analytics Cards displaying automatically calculated metrics based on filtered data:

  - Total Trades & Win Rate (%)

  - Total R:R Realized

  - Average R:R per trade

  - Best Performing Asset / Asset Class

- Visual Charts:

  - Cumulative Equity Curve (Profit over time)

  - Win/Loss ratio bar chart by asset category.

### 3. TRADE LOG (JOURNAL) MODULE

- "Add New Trade" Modal / Form with fields:

  - Date & Time

  - Asset Category (Crypto / Forex / Metals)

  - Trading Pair (e.g., EUR/USD, XAU/USD, BTC/USDT)

  - Position Type (Long / Short)

  - Setup Selected (Dropdown linking to saved setups from the Setup Manager)

  - Entry Price, Stop Loss, Take Profit, Realized R:R

  - Trade Reason / Confluence Notes (Textarea)

  - TradingView Chart URL (Link input)

  - Trade Outcome (Win / Loss / Break-Even)

- Trade History Table: Displays all saved trades with color-coded status, clickable TradingView links, tags, and actions to Edit or Delete entries.

### 4. RISK MANAGEMENT & SETUP MANAGER

- "Risk Rules" Section: Text fields and checklists to store personal Money Management rules (e.g., Max 1% risk per trade, Max 2 losses per day).

- "SMC Setups Library": Allow users to create, name, and manage custom setups (e.g., "Judas Swing + FVG Entry", "Turtle Soup + OB Sweep"). Each setup can have a name, description, and required confluence checklist.

### 5. SMC / ICT AI VALIDATOR BOT

- Create a dedicated chat/analysis interface called "SMC Validator Bot".

- Interface elements: Image drop zone (for TradingView screenshots) AND a URL input field for TradingView chart links.

- Logic/Personality: The bot must evaluate trade ideas STRICTLY using Smart Money Concepts (ICT) — ignoring legacy technical analysis (like indicators, trendlines, or head-and-shoulders).

- Structured output response format:

  1. Market Structure Check (BOS / ChoCh / HTF Trend)

  2. Liquidity Analysis (Internal/External Liquidity Sweeps)

  3. Price Action & POI (FVG, Order Block, Breaker Block, Premium/Discount Zone)

  4. Final Verdict: CONFIRMED / INVALIDATED / HIGH RISK with a short explanatory summary.

- (Use mock/simulated analysis data for now until API keys are attached).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tokarsoft19.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/05899e2d-417b-4bf5-b981-9c14c18c6f23).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
