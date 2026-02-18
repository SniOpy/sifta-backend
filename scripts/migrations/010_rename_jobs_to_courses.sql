-- Migration: Renommage jobs → courses (idempotent)
-- Date: 2026-02-07

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses')
  THEN
    DROP TABLE jobs;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses')
  THEN
    ALTER TABLE jobs RENAME TO courses;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_job_status' AND conrelid = 'public.courses'::regclass) THEN
      ALTER TABLE courses RENAME CONSTRAINT chk_job_status TO chk_course_status;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_jobs_seller' AND conrelid = 'public.courses'::regclass) THEN
      ALTER TABLE courses RENAME CONSTRAINT fk_jobs_seller TO fk_courses_seller;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_jobs_courier' AND conrelid = 'public.courses'::regclass) THEN
      ALTER TABLE courses RENAME CONSTRAINT fk_jobs_courier TO fk_courses_courier;
    END IF;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_jobs_seller_id;
CREATE INDEX IF NOT EXISTS idx_courses_seller_id ON courses(seller_id);
DROP INDEX IF EXISTS idx_jobs_courier_id;
CREATE INDEX IF NOT EXISTS idx_courses_courier_id ON courses(courier_id);
DROP INDEX IF EXISTS idx_jobs_status;
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
DROP INDEX IF EXISTS idx_jobs_city;
CREATE INDEX IF NOT EXISTS idx_courses_city ON courses(city);
DROP INDEX IF EXISTS idx_jobs_cash_collected;
CREATE INDEX IF NOT EXISTS idx_courses_cash_collected ON courses(cash_collected);
DROP INDEX IF EXISTS idx_jobs_created_at;
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
