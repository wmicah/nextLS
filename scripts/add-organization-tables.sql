-- Safe migration to add organization support without losing existing data
-- This script only adds new tables and columns with default values

-- 1. Add organizationId column to users table (nullable, so no data loss)
ALTER TABLE users ADD COLUMN organization_id TEXT;
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- 2. Add organizationId and primaryCoachId columns to clients table (nullable)
ALTER TABLE clients ADD COLUMN organization_id TEXT;
ALTER TABLE clients ADD COLUMN primary_coach_id TEXT;
CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_clients_primary_coach_id ON clients(primary_coach_id);

-- 3. Add organization sharing columns to programs table
ALTER TABLE programs ADD COLUMN organization_id TEXT;
ALTER TABLE programs ADD COLUMN shared_with_org BOOLEAN DEFAULT false;
ALTER TABLE programs ADD COLUMN created_by_coach_id TEXT;
CREATE INDEX idx_programs_organization_id ON programs(organization_id);
CREATE INDEX idx_programs_shared_with_org ON programs(shared_with_org);

-- 4. Add organization sharing columns to routines table
ALTER TABLE routines ADD COLUMN organization_id TEXT;
ALTER TABLE routines ADD COLUMN shared_with_org BOOLEAN DEFAULT false;
ALTER TABLE routines ADD COLUMN created_by_coach_id TEXT;
CREATE INDEX idx_routines_organization_id ON routines(organization_id);
CREATE INDEX idx_routines_shared_with_org ON routines(shared_with_org);

-- 5. Create organizations table
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tier TEXT NOT NULL DEFAULT 'SOLO',
    coach_limit INTEGER NOT NULL DEFAULT 1,
    client_limit INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id TEXT NOT NULL
);

-- 6. Create coach_organizations table (junction table)
CREATE TABLE coach_organizations (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'COACH',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(coach_id, organization_id)
);

-- 7. Create client_coach_assignments table
CREATE TABLE client_coach_assignments (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    coach_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    role TEXT NOT NULL DEFAULT 'ASSISTANT',
    UNIQUE(client_id, coach_id)
);

-- 8. Add foreign key constraints (these will be added after the migration)
-- Note: We'll add these in a separate step to avoid any issues

-- 9. Create indexes for performance
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_coach_organizations_coach_id ON coach_organizations(coach_id);
CREATE INDEX idx_coach_organizations_organization_id ON coach_organizations(organization_id);
CREATE INDEX idx_client_coach_assignments_client_id ON client_coach_assignments(client_id);
CREATE INDEX idx_client_coach_assignments_coach_id ON client_coach_assignments(coach_id);

-- 10. Add foreign key constraints (safe to add after tables exist)
-- These will be added by Prisma in the next migration step
