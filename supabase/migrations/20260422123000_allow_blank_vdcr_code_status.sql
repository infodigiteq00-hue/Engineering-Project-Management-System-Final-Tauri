-- Allow blank code status in VDCR records (for bulk upload rows where user leaves Code Status empty).
-- Keep existing valid values unchanged.

ALTER TABLE public.vdcr_records
  DROP CONSTRAINT IF EXISTS vdcr_records_code_status_check;

ALTER TABLE public.vdcr_records
  DROP CONSTRAINT IF EXISTS code_status_values_check;

ALTER TABLE public.vdcr_records
  ADD CONSTRAINT vdcr_records_code_status_check
  CHECK (
    code_status IS NULL
    OR btrim(code_status) = ''
    OR code_status = ANY (ARRAY['Code 1', 'Code 2', 'Code 3', 'Code 4'])
  );

