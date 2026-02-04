-- Supabase SQL Schema for Al-Mizan Law Office Manager
-- Created for medium-sized law firms (5-20 lawyers)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE case_status AS ENUM ('OPEN', 'CLOSED', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE court_type AS ENUM ('CIVIL', 'CRIMINAL', 'COMMERCIAL', 'ADMINISTRATIVE', 'FAMILY', 'LABOR');
CREATE TYPE client_type AS ENUM ('INDIVIDUAL', 'COMPANY');
CREATE TYPE client_status AS ENUM ('ACTIVE', 'INACTIVE', 'POTENTIAL');
CREATE TYPE hearing_status AS ENUM ('SCHEDULED', 'COMPLETED', 'POSTPONED', 'CANCELLED');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('pending', 'completed');
CREATE TYPE task_type AS ENUM ('memo', 'admin', 'finance', 'other');
CREATE TYPE transaction_type AS ENUM ('payment', 'expense');
CREATE TYPE permission_level AS ENUM ('none', 'read', 'write');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_label VARCHAR(50) NOT NULL DEFAULT 'محامي',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type client_type NOT NULL DEFAULT 'INDIVIDUAL',
    status client_status NOT NULL DEFAULT 'ACTIVE',
    phone VARCHAR(20) NOT NULL,
    secondary_phone VARCHAR(20),
    national_id VARCHAR(50),
    nationality VARCHAR(50) DEFAULT 'مصري',
    address TEXT,
    email VARCHAR(100),
    poa_number VARCHAR(50),
    poa_type VARCHAR(100),
    poa_expiry DATE,
    company_representative VARCHAR(100),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases Table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    court court_type NOT NULL,
    court_branch VARCHAR(100),
    circle VARCHAR(100),
    judge_name VARCHAR(100),
    stage VARCHAR(50),
    status case_status NOT NULL DEFAULT 'OPEN',
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_name VARCHAR(200),
    client_role VARCHAR(50),
    description TEXT,
    open_date DATE NOT NULL,
    update_date DATE,
    responsible_lawyer VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Finance Table
CREATE TABLE case_finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    agreed_fees DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Transactions Table
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hearings Table
CREATE TABLE hearings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME,
    type VARCHAR(50),
    status hearing_status DEFAULT 'SCHEDULED',
    decision TEXT,
    requirements TEXT,
    client_requirements TEXT,
    is_completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hearing Expenses Table
CREATE TABLE hearing_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hearing_id UUID NOT NULL REFERENCES hearings(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    paid_by VARCHAR(20) NOT NULL CHECK (paid_by IN ('lawyer', 'client')),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    due_date DATE NOT NULL,
    priority priority_level DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    related_case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    type task_type DEFAULT 'other',
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Log Table
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    target VARCHAR(200),
    user_id UUID NOT NULL REFERENCES users(id),
    user_name VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Permissions Table
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    access permission_level NOT NULL DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- Legal References Table
CREATE TABLE legal_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    branch VARCHAR(50),
    description TEXT,
    article_number VARCHAR(50),
    year INTEGER,
    court_name VARCHAR(100),
    author VARCHAR(100),
    url TEXT,
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    url TEXT NOT NULL,
    size VARCHAR(50),
    upload_date DATE NOT NULL,
    is_original BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Notes Table
CREATE TABLE case_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Memos Table
CREATE TABLE case_memos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case Rulings Table
CREATE TABLE case_rulings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(50),
    content TEXT NOT NULL,
    url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_responsible_lawyer ON cases(responsible_lawyer);
CREATE INDEX idx_hearings_case_id ON hearings(case_id);
CREATE INDEX idx_hearings_date ON hearings(date);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_financial_transactions_case_id ON financial_transactions(case_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX idx_activity_log_timestamp ON activity_log(timestamp);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);

-- Create Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers for Updated At
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_finance_updated_at BEFORE UPDATE ON case_finance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hearings_updated_at BEFORE UPDATE ON hearings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_references_updated_at BEFORE UPDATE ON legal_references FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearing_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_rulings ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (can be customized based on requirements)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "All authenticated users can view clients" ON clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage clients" ON clients FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can view cases" ON cases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage cases" ON cases FOR ALL USING (auth.role() = 'authenticated');

-- Similar policies can be added for other tables...

-- Insert Default Admin User
INSERT INTO users (username, email, name, password_hash, role_label) 
VALUES ('admin', 'admin@lawoffice.com', 'مدير النظام', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', 'مدير النظام');

-- Insert default permissions for admin
INSERT INTO user_permissions (user_id, module_id, access) 
SELECT 
    u.id,
    module_id,
    'write'::permission_level
FROM users u, 
     (SELECT unnest(ARRAY['cases', 'clients', 'finance', 'references', 'users', 'settings', 'reports', 'documents', 'hearings', 'tasks', 'activities', 'system']) as module_id) modules
WHERE u.username = 'admin';
