BEGIN;

ALTER TABLE quote_versions
  ADD COLUMN policy_accepted_at timestamptz NOT NULL,
  ADD COLUMN policy_acceptance jsonb NOT NULL;

ALTER TABLE quote_versions
  ADD CONSTRAINT policy_acceptance_evidence CHECK (
    jsonb_typeof(policy_acceptance) = 'object'
    AND policy_acceptance ->> 'version' = terms_version
    AND policy_acceptance ->> 'sha256' = terms_sha256
    AND policy_acceptance ->> 'acceptanceMethod' = 'clickwrap'
    AND policy_acceptance ->> 'purchaseTermsAccepted' = 'true'
    AND policy_acceptance ->> 'coreWarrantyAcknowledged' = 'true'
    AND policy_acceptance ->> 'electronicRecordsConsented' = 'true'
    AND policy_acceptance ->> 'url' ~ '^https://integritydrivetrain[.]com/legal/reman-policy-bundle-[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  );

COMMENT ON COLUMN quote_versions.policy_acceptance IS
  'Immutable clickwrap evidence: accepted document version, SHA-256, URL, timestamp and separate customer acknowledgments.';

COMMIT;
