-- ============================================================
-- Migration: 001_payroll_enhancement
-- Safe to re-run (uses IF NOT EXISTS / IF NOT EXISTS guards)
-- ============================================================

-- ── 1. New master data tables ─────────────────────────────────

CREATE TABLE IF NOT EXISTS job_categories (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grades (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS designations (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nopay_days (
    id          SERIAL        PRIMARY KEY,
    code        VARCHAR(20)   NOT NULL UNIQUE,
    name        VARCHAR(100)  NOT NULL,
    days        NUMERIC(5, 2) NOT NULL DEFAULT 1,
    description TEXT,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. ALTER allowances ───────────────────────────────────────

ALTER TABLE allowances
    ADD COLUMN IF NOT EXISTS liable_for_epf   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS liable_for_etf   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS liable_for_nopay BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 3. ALTER deductions ───────────────────────────────────────

ALTER TABLE deductions
    ADD COLUMN IF NOT EXISTS liable_for_epf   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS liable_for_etf   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS liable_for_nopay BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 4. ALTER overtime_types ───────────────────────────────────

ALTER TABLE overtime_types
    ADD COLUMN IF NOT EXISTS liable_for_epf   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS liable_for_etf   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS liable_for_nopay BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 5. ALTER employees ────────────────────────────────────────

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS payroll_name              VARCHAR(200),
    ADD COLUMN IF NOT EXISTS employee_type             VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nopay_days_id             INTEGER REFERENCES nopay_days(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS job_category_id           INTEGER REFERENCES job_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS designation_id            INTEGER REFERENCES designations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS branch_id                 INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS grade_id                  INTEGER REFERENCES grades(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS addr_line1                VARCHAR(200),
    ADD COLUMN IF NOT EXISTS addr_line2                VARCHAR(200),
    ADD COLUMN IF NOT EXISTS addr_city                 VARCHAR(100),
    ADD COLUMN IF NOT EXISTS addr_district             VARCHAR(100),
    ADD COLUMN IF NOT EXISTS addr_country              VARCHAR(10)  DEFAULT 'LK',
    ADD COLUMN IF NOT EXISTS emergency_contact_person  VARCHAR(200),
    ADD COLUMN IF NOT EXISTS emergency_address         TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_number  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS emergency_email           VARCHAR(200);

-- ── 6. Backfill: migrate flat address → structured columns ────

UPDATE employees
SET addr_line1 = address
WHERE addr_line1 IS NULL
  AND address IS NOT NULL
  AND address <> '';

-- ── 7. Indexes for FK lookups ─────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_employees_job_category  ON employees(job_category_id);
CREATE INDEX IF NOT EXISTS idx_employees_designation   ON employees(designation_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch        ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_grade         ON employees(grade_id);
CREATE INDEX IF NOT EXISTS idx_employees_nopay_days    ON employees(nopay_days_id);
