set search_path = throulyscout, public, extensions;


-- Recreate the trigger on auth.users
CREATE OR REPLACE FUNCTION throulyscout.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = throulyscout
AS $$
BEGIN
  INSERT INTO throulyscout.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'client'
  );
  
  INSERT INTO throulyscout.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created_throulyscout
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION throulyscout.handle_new_user();

-- Insert missing profiles for existing auth users
INSERT INTO throulyscout.profiles (id, email, full_name, role)
SELECT u.id, u.email, u.raw_user_meta_data ->> 'full_name', 'client'
FROM auth.users u
LEFT JOIN throulyscout.profiles p ON p.id = u.id
WHERE p.id IS NULL;
