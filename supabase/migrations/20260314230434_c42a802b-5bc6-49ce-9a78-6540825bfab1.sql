set search_path = throulyscout, public, extensions;


-- Add missing role values to app_role enum
ALTER TYPE throulyscout.app_role ADD VALUE IF NOT EXISTS 'agent';
ALTER TYPE throulyscout.app_role ADD VALUE IF NOT EXISTS 'broker';
ALTER TYPE throulyscout.app_role ADD VALUE IF NOT EXISTS 'client';
