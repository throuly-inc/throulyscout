-- Link deal to the currently logged-in client
UPDATE public.deals SET client_id = '17b35e1a-867b-4f17-97d4-b5dadf748302' WHERE id = '2ecd1c93-3aac-4e22-9e84-bbff056b918a';

-- Re-assign tasks to this client
UPDATE public.tasks SET assigned_to = '17b35e1a-867b-4f17-97d4-b5dadf748302' WHERE deal_id = '2ecd1c93-3aac-4e22-9e84-bbff056b918a' AND assigned_to = 'cfbbd0ab-1c04-4e32-adc5-21f7b7843c4c';