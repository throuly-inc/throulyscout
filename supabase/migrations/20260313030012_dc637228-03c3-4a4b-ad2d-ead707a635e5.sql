-- Allow clients to insert timeline entries for their deals
CREATE POLICY "Clients can write timeline for own deals"
ON public.timeline_entries
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = timeline_entries.deal_id
    AND deals.client_id = auth.uid()
  )
);

-- Set up test data: mark client onboarding complete and link to a deal
UPDATE public.profiles SET onboarding_complete = true WHERE id = 'cfbbd0ab-1c04-4e32-adc5-21f7b7843c4c';

UPDATE public.deals SET client_id = 'cfbbd0ab-1c04-4e32-adc5-21f7b7843c4c' WHERE id = '2ecd1c93-3aac-4e22-9e84-bbff056b918a';

-- Add timeline entries for this deal
INSERT INTO public.timeline_entries (deal_id, entry_type, content, created_by) VALUES
('2ecd1c93-3aac-4e22-9e84-bbff056b918a', 'system', 'Deal created', 'cc6e6064-4f87-44d5-aeda-7c8e5e5dd82a'),
('2ecd1c93-3aac-4e22-9e84-bbff056b918a', 'stage_change', 'Stage changed to Pre-Approval', 'cc6e6064-4f87-44d5-aeda-7c8e5e5dd82a'),
('2ecd1c93-3aac-4e22-9e84-bbff056b918a', 'note', 'Client prequalified with lender', 'cc6e6064-4f87-44d5-aeda-7c8e5e5dd82a');

-- Add tasks assigned to the client
INSERT INTO public.tasks (deal_id, title, description, status, assigned_to, created_by, due_date) VALUES
('2ecd1c93-3aac-4e22-9e84-bbff056b918a', 'Upload proof of income', 'Please upload your W-2 or recent pay stubs', 'pending', 'cfbbd0ab-1c04-4e32-adc5-21f7b7843c4c', 'cc6e6064-4f87-44d5-aeda-7c8e5e5dd82a', '2026-03-20'),
('2ecd1c93-3aac-4e22-9e84-bbff056b918a', 'Sign disclosure forms', 'Review and sign the property disclosure documents', 'pending', 'cfbbd0ab-1c04-4e32-adc5-21f7b7843c4c', 'cc6e6064-4f87-44d5-aeda-7c8e5e5dd82a', '2026-03-25'),
('2ecd1c93-3aac-4e22-9e84-bbff056b918a', 'Confirm pre-approval letter', NULL, 'completed', 'cfbbd0ab-1c04-4e32-adc5-21f7b7843c4c', 'cc6e6064-4f87-44d5-aeda-7c8e5e5dd82a', NULL);