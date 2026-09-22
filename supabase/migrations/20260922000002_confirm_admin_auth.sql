-- Confirm the admin user email
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'admin@cardsync.io';

-- Auto-confirm trigger for any new auth users created
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_confirm_new_user();
