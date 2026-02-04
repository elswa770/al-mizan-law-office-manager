import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = 'https://mlbwhlocvbdjfwjnwscs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYndobG9jdmJkamZ3am53c2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzAzMTQsImV4cCI6MjA4NTgwNjMxNH0.QH9G22byPWvtPWa_WxmxHQPWDHmgDRiGnnrOJLlTOnU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Tables Structure
export interface DatabaseCase {
  id: string;
  case_number: string;
  title: string;
  year: number;
  court: string;
  court_branch?: string;
  circle?: string;
  judge_name?: string;
  stage?: string;
  status: string;
  client_id: string;
  client_name?: string;
  client_role?: string;
  opponents?: any[];
  description?: string;
  open_date: string;
  update_date?: string;
  responsible_lawyer?: string;
  finance?: {
    agreed_fees: number;
    history: Array<{
      id: string;
      type: 'payment' | 'expense';
      amount: number;
      date: string;
      description: string;
      category?: string;
    }>;
  };
  notes?: any[];
  strategy?: any;
  documents?: any[];
  memos?: any[];
  rulings?: any[];
  ai_chat_history?: any[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseClient {
  id: string;
  name: string;
  type: string;
  status: string;
  phone: string;
  secondary_phone?: string;
  national_id: string;
  nationality?: string;
  address?: string;
  email?: string;
  poa_number?: string;
  poa_type?: string;
  poa_expiry?: string;
  company_representative?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role_label: string;
  is_active: boolean;
  permissions: Array<{
    module_id: string;
    access: string;
  }>;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseHearing {
  id: string;
  case_id: string;
  date: string;
  time: string;
  status: string;
  type: string;
  location?: string;
  notes?: string;
  expenses?: {
    amount: number;
    description: string;
    paid_by: string;
    date: string;
  };
  created_at: string;
  updated_at: string;
}

export interface DatabaseTask {
  id: string;
  title: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  related_case_id?: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseActivity {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  type: string;
  details?: any;
  created_at: string;
}
