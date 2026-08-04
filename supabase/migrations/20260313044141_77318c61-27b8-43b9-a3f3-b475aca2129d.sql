set search_path = throulyscout, public, extensions;

ALTER TABLE throulyscout.offers DROP CONSTRAINT offers_status_check;
ALTER TABLE throulyscout.offers ADD CONSTRAINT offers_status_check CHECK (status = ANY (ARRAY['draft', 'submitted', 'countered', 'resubmitted', 'accepted', 'rejected', 'declined', 'withdrawn']));