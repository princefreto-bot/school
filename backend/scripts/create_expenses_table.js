require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Creating saas_expenses table...");
  const sql = `
    CREATE TABLE IF NOT EXISTS saas_expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category VARCHAR(255) NOT NULL,
      amount NUMERIC NOT NULL,
      period VARCHAR(50) DEFAULT 'annuel',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  // We can't run raw SQL through standard client without an RPC, but we can try 
  // Wait, the client might not have admin rights for arbitrary SQL unless there's an RPC.
  // We can check if RPC 'exec_sql' exists, or we can just ask the user to run it in SQL editor.
  console.log("SQL to run in Supabase Editor:\n", sql);
}

run();
