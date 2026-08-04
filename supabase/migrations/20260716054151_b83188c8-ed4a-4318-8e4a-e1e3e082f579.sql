set search_path = throulyscout, public, extensions;


DROP TRIGGER IF EXISTS on_auth_user_created_throulyscout ON auth.users;
CREATE TRIGGER on_auth_user_created_throulyscout
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION throulyscout.handle_new_user();

-- Backfill missing profiles for existing users
INSERT INTO throulyscout.profiles (id, email, full_name)
SELECT u.id, u.email, u.raw_user_meta_data ->> 'full_name'
FROM auth.users u
LEFT JOIN throulyscout.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO throulyscout.user_roles (user_id, role)
SELECT u.id, 'user'::throulyscout.app_role
FROM auth.users u
LEFT JOIN throulyscout.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
