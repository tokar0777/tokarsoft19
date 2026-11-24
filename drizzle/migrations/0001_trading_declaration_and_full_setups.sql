CREATE TABLE IF NOT EXISTS public.trading_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_declarations TO authenticated;
GRANT ALL ON public.trading_declarations TO service_role;

ALTER TABLE public.trading_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own trading declaration"
  ON public.trading_declarations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_trading_declarations_updated_at
  BEFORE UPDATE ON public.trading_declarations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.setups
  ADD COLUMN IF NOT EXISTS timeframes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS entry_rules text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invalidation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS targets text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb;