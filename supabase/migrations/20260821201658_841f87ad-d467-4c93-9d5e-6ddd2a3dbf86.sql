CREATE TABLE public.setups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  confluences TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  traded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  category TEXT NOT NULL,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL,
  setup_id UUID REFERENCES public.setups ON DELETE SET NULL,
  entry_price NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  realized_r NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  chart_url TEXT,
  outcome TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.risk_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rule TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.setups TO authenticated;
GRANT ALL ON public.setups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_rules TO authenticated;
GRANT ALL ON public.risk_rules TO service_role;

ALTER TABLE public.setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own setups" ON public.setups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage their own trades" ON public.trades FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage their own risk rules" ON public.risk_rules FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_setups_updated_at BEFORE UPDATE ON public.setups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.seed_new_trader()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  judas UUID;
  turtle UUID;
  silver UUID;
BEGIN
  INSERT INTO public.setups (user_id, name, description, confluences)
  VALUES (NEW.id, 'Judas Swing + FVG Entry', 'London Judas Swing sweeping Asian range highs/lows, then entry on the displacement FVG.', ARRAY['Asian range swept','Displacement leg with FVG','HTF premium/discount aligned','Killzone timing'])
  RETURNING id INTO judas;

  INSERT INTO public.setups (user_id, name, description, confluences)
  VALUES (NEW.id, 'Turtle Soup + OB Sweep', 'False breakout of a previous session high/low, mitigation of the origin order block.', ARRAY['Previous session liquidity swept','ChoCh on LTF','Order block mitigation','SMT divergence'])
  RETURNING id INTO turtle;

  INSERT INTO public.setups (user_id, name, description, confluences)
  VALUES (NEW.id, 'Silver Bullet 10-11 AM', 'New York AM killzone FVG entry within the 10:00-11:00 window.', ARRAY['Inside 10-11 AM window','FVG formed after displacement','Draw on liquidity identified'])
  RETURNING id INTO silver;

  INSERT INTO public.risk_rules (user_id, rule, is_active) VALUES
    (NEW.id, 'Max 1% account risk per trade', true),
    (NEW.id, 'Max 2 losing trades per day, then stop', true),
    (NEW.id, 'Only trade London and New York killzones', true),
    (NEW.id, 'No trade without a clear liquidity sweep', true),
    (NEW.id, 'Minimum 1:3 R:R target on every entry', true);

  INSERT INTO public.trades (user_id, traded_at, category, pair, direction, setup_id, entry_price, stop_loss, take_profit, realized_r, notes, chart_url, outcome) VALUES
    (NEW.id, now() - interval '38 days', 'Forex', 'EUR/USD', 'Long', judas, 1.0842, 1.0821, 1.0905, 3.0, 'Asian low swept at 03:15, strong displacement into London FVG.', 'https://www.tradingview.com/chart/', 'Win'),
    (NEW.id, now() - interval '35 days', 'Metals', 'XAU/USD', 'Short', turtle, 2358.40, 2366.20, 2335.00, -1.0, 'Turtle soup failed, price continued into HTF premium.', 'https://www.tradingview.com/chart/', 'Loss'),
    (NEW.id, now() - interval '31 days', 'Crypto', 'BTC/USDT', 'Long', silver, 62150, 61480, 64100, 2.5, 'Silver bullet FVG in NY AM, clean draw to old highs.', 'https://www.tradingview.com/chart/', 'Win'),
    (NEW.id, now() - interval '27 days', 'Forex', 'GBP/USD', 'Short', judas, 1.2735, 1.2762, 1.2650, 2.0, 'London Judas above previous day high, ChoCh on M5.', 'https://www.tradingview.com/chart/', 'Win'),
    (NEW.id, now() - interval '24 days', 'Crypto', 'ETH/USDT', 'Short', turtle, 3410, 3455, 3280, -1.0, 'Entered before ChoCh confirmation, stopped on the sweep.', 'https://www.tradingview.com/chart/', 'Loss'),
    (NEW.id, now() - interval '20 days', 'Metals', 'XAG/USD', 'Long', silver, 28.42, 28.18, 29.10, 1.8, 'Discount array tapped, decent expansion into NY close.', 'https://www.tradingview.com/chart/', 'Win'),
    (NEW.id, now() - interval '17 days', 'Forex', 'USD/JPY', 'Long', judas, 156.20, 155.75, 157.40, 0.0, 'Moved stop to breakeven ahead of news.', 'https://www.tradingview.com/chart/', 'Break-Even'),
    (NEW.id, now() - interval '13 days', 'Crypto', 'SOL/USDT', 'Long', silver, 142.30, 138.60, 155.00, 3.2, 'External liquidity sweep then breaker retest.', 'https://www.tradingview.com/chart/', 'Win'),
    (NEW.id, now() - interval '10 days', 'Metals', 'XAU/USD', 'Long', turtle, 2402.10, 2392.00, 2438.00, 2.8, 'Weekly discount, OB mitigation with SMT vs silver.', 'https://www.tradingview.com/chart/', 'Win'),
    (NEW.id, now() - interval '7 days', 'Forex', 'EUR/USD', 'Short', judas, 1.0910, 1.0932, 1.0845, -1.0, 'Counter-HTF trend, invalid setup in hindsight.', 'https://www.tradingview.com/chart/', 'Loss'),
    (NEW.id, now() - interval '4 days', 'Crypto', 'BTC/USDT', 'Short', turtle, 68450, 69100, 66500, 2.2, 'Swept weekly highs, ChoCh then clean short.', 'https://www.tradingview.com/chart/', 'Win'),
    (NEW.id, now() - interval '1 days', 'Forex', 'GBP/JPY', 'Long', silver, 198.40, 197.80, 200.20, 1.5, 'NY AM silver bullet, partial at internal liquidity.', 'https://www.tradingview.com/chart/', 'Win');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_seed_trader
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.seed_new_trader();