ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text, ADD COLUMN IF NOT EXISTS pending_nickname text;

CREATE OR REPLACE FUNCTION public.request_nickname(_nick text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n text := btrim(_nick); cur text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF n IS NULL OR length(n) < 2 OR length(n) > 14 THEN RAISE EXCEPTION 'nickname must be 2-14 chars'; END IF;
  SELECT nickname INTO cur FROM public.profiles WHERE id = auth.uid();
  IF cur IS NULL THEN
    UPDATE public.profiles SET nickname = n, pending_nickname = NULL WHERE id = auth.uid();
    RETURN 'set';
  END IF;
  UPDATE public.profiles SET pending_nickname = n WHERE id = auth.uid();
  RETURN 'pending';
END $$;

CREATE OR REPLACE FUNCTION public.review_nickname(_user uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _approve THEN
    UPDATE public.profiles SET nickname = pending_nickname, pending_nickname = NULL WHERE id = _user AND pending_nickname IS NOT NULL;
  ELSE
    UPDATE public.profiles SET pending_nickname = NULL WHERE id = _user;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.request_nickname(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_nickname(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_nickname(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_nickname(uuid, boolean) TO authenticated;