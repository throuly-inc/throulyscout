set search_path = throulyscout, public, extensions;


-- Create anonymous_messages table for masked messaging
CREATE TABLE throulyscout.anonymous_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_alias text NOT NULL,
  recipient_type text NOT NULL CHECK (recipient_type IN ('agent', 'lender', 'seller')),
  recipient_id uuid NOT NULL,
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  sender_user_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE throulyscout.anonymous_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (privacy-first: no sign-in required)
CREATE POLICY "Anyone can send anonymous messages"
ON throulyscout.anonymous_messages
FOR INSERT
WITH CHECK (true);

-- Senders can read their own messages (if signed in)
CREATE POLICY "Senders can view own messages"
ON throulyscout.anonymous_messages
FOR SELECT
USING (auth.uid() = sender_user_id);
