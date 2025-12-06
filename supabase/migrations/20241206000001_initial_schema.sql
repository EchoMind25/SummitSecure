-- Enable RLS
--ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Firms table (represents accounting/consulting firms)
CREATE TABLE firms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (firm employees)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branding settings for firms
CREATE TABLE branding_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  require_client_password BOOLEAN DEFAULT false,
  show_powered_by BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  share_id TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- optional password for client access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- path in Supabase storage
  uploaded_by UUID REFERENCES users(id),
  is_locked BOOLEAN DEFAULT true,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  action TEXT NOT NULL, -- 'upload', 'download', 'unlock', 'lock', etc.
  resource_type TEXT NOT NULL, -- 'file', 'client', etc.
  resource_id UUID NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_firm_id ON users(firm_id);
CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_files_client_id ON files(client_id);
CREATE INDEX idx_files_firm_id ON files(firm_id);
CREATE INDEX idx_audit_log_firm_id ON audit_log(firm_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Firms policies (users can only see their own firm)
CREATE POLICY "Users can view their own firm" ON firms
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM users WHERE firm_id = firms.id
  ));

-- Users policies
CREATE POLICY "Users can view members of their firm" ON users
  FOR SELECT USING (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Branding settings policies
CREATE POLICY "Users can view their firm's branding" ON branding_settings
  FOR SELECT USING (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their firm's branding" ON branding_settings
  FOR UPDATE USING (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

-- Clients policies
CREATE POLICY "Users can view their firm's clients" ON clients
  FOR SELECT USING (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create clients for their firm" ON clients
  FOR INSERT WITH CHECK (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their firm's clients" ON clients
  FOR UPDATE USING (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Public can view clients by share_id for file drops" ON clients
  FOR SELECT USING (true);

-- Files policies
CREATE POLICY "Users can view files for their firm's clients" ON files
  FOR SELECT USING (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create files for their firm's clients" ON files
  FOR INSERT WITH CHECK (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update files for their firm's clients" ON files
  FOR UPDATE USING (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

-- Audit log policies
CREATE POLICY "Users can view audit logs for their firm" ON audit_log
  FOR SELECT USING (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create audit logs for their firm" ON audit_log
  FOR INSERT WITH CHECK (firm_id IN (
    SELECT firm_id FROM users WHERE id = auth.uid()
  ));

-- Functions for audit logging
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_client_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
  v_firm_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get firm_id from user or client
  IF p_client_id IS NOT NULL THEN
    SELECT firm_id INTO v_firm_id FROM clients WHERE id = p_client_id;
  ELSE
    SELECT firm_id INTO v_firm_id FROM users WHERE id = v_user_id;
  END IF;

  INSERT INTO audit_log (
    firm_id, user_id, client_id, action, resource_type, resource_id, metadata
  ) VALUES (
    v_firm_id, v_user_id, p_client_id, p_action, p_resource_type, p_resource_id, p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock files
CREATE OR REPLACE FUNCTION unlock_client_files(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE files
  SET is_locked = false, unlocked_at = NOW()
  WHERE client_id = p_client_id AND is_locked = true;

  -- Log the unlock action
  PERFORM log_audit_event('unlock', 'client', p_client_id, p_client_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtime subscriptions
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_log;

