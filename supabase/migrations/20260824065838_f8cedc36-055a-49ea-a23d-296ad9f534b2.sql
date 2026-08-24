CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_first boolean;
  is_owner boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first;
  is_owner := lower(COALESCE(NEW.email, '')) = 'tokarencovadim77@gmail.com';

  INSERT INTO public.profiles (id, email, status)
  VALUES (NEW.id, COALESCE(NEW.email, ''), CASE WHEN is_first OR is_owner THEN 'approved'::public.account_status ELSE 'pending'::public.account_status END);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first OR is_owner THEN 'admin'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;