-- Seed common RMF Information Types
BEGIN;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('PII', 'Personally Identifiable Information', 'Information that can be used to distinguish or trace an individual’s identity.', 'NIST SP 800-122')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('PHI', 'Protected Health Information', 'Individually identifiable health information protected under HIPAA.', 'HIPAA')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('CUI', 'Controlled Unclassified Information', 'Information the Government creates or possesses, or that an entity creates or possesses for or on behalf of the Government, that a law, regulation, or Government-wide policy requires or permits an agency to handle using safeguarding or dissemination controls.', 'CUI Registry')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('PCI', 'Payment Card Information', 'Cardholder data including primary account number (PAN), cardholder name, service code, and expiration date.', 'PCI DSS')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('FCI', 'Federal Contract Information', 'Information not intended for public release that is provided by or generated for the Government under a contract to develop or deliver a product or service to the Government.', 'FAR 52.204-21')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('FIN', 'Financial Data', 'Financial statements, budgets, transactions, and related financial records.', 'Org Policy')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('LOGS', 'Audit and Security Logs', 'System, application, and security logs used for monitoring and investigation.', 'NIST SP 800-92')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('CONFIG', 'System Configuration Data', 'Configuration files, infrastructure-as-code, and parameter sets for systems.', 'Org Policy')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('SRC', 'Source Code', 'Application and infrastructure source code repositories and artifacts.', 'Org Policy')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.rmf_information_types (code, title, description, source)
VALUES
  ('OPS', 'Operational Data', 'Operational metrics, schedules, and process data.', 'Org Policy')
ON CONFLICT (code) DO NOTHING;

COMMIT;
