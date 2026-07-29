
-- Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days')
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own invitations" ON public.invitations
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own invitations" ON public.invitations
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own invitations" ON public.invitations
  FOR UPDATE USING (agent_id = auth.uid());

CREATE POLICY "Agents can delete own invitations" ON public.invitations
  FOR DELETE USING (agent_id = auth.uid());

-- Allow reading invitations by code (for accepting during signup)
CREATE POLICY "Anyone can read invitation by code" ON public.invitations
  FOR SELECT USING (true);

-- Create accept_invitation function (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.accept_invitation(invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv record;
  agent_name text;
  agent_phone text;
BEGIN
  -- Find the invitation
  SELECT * INTO inv FROM public.invitations
  WHERE code = invite_code AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Update invitation status
  UPDATE public.invitations SET status = 'accepted' WHERE id = inv.id;

  -- Set user role to client and complete onboarding
  UPDATE public.profiles
  SET role = 'client', onboarding_complete = true, updated_at = now()
  WHERE id = auth.uid();

  -- Sync to user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'client'::public.app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'client'::public.app_role;

  -- Link the contact
  UPDATE public.contacts
  SET linked_user_id = auth.uid()
  WHERE id = inv.contact_id;

  -- Link any deals that reference this contact
  UPDATE public.deals
  SET client_id = auth.uid(), updated_at = now()
  WHERE agent_id = inv.agent_id
    AND id IN (SELECT deal_id FROM public.contacts WHERE id = inv.contact_id AND deal_id IS NOT NULL);

  -- Get agent info for welcome screen
  SELECT full_name, phone INTO agent_name, agent_phone
  FROM public.profiles WHERE id = inv.agent_id;

  RETURN jsonb_build_object(
    'success', true,
    'agent_name', COALESCE(agent_name, 'Your Agent'),
    'agent_id', inv.agent_id
  );
END;
$$;

-- Add type column to connection_requests if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'connection_requests' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.connection_requests ADD COLUMN type text DEFAULT 'general';
  END IF;
END $$;

-- Add to_user_id column to connection_requests if not exists  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'connection_requests' AND column_name = 'to_user_id'
  ) THEN
    ALTER TABLE public.connection_requests ADD COLUMN to_user_id uuid REFERENCES public.profiles(id);
  END IF;
END $$;

-- RLS for connection_requests: users can see requests they sent or received
CREATE POLICY "Users can see own connection requests" ON public.connection_requests
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can insert connection requests" ON public.connection_requests
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Recipients can update connection requests" ON public.connection_requests
  FOR UPDATE USING (to_user_id = auth.uid());
