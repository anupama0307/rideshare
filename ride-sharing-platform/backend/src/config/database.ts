import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { config } from './index.js';

// Supabase client for auth and RLS-enabled queries
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Direct PostgreSQL pool for complex queries (tsrange operations)
// Falls back gracefully if direct connection fails
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test database connection - tries pg pool first, then falls back to Supabase client
export async function testConnection(): Promise<boolean> {
  // First try direct pg connection
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful (direct pg)');
    return true;
  } catch (pgError) {
    console.log('⚠️ Direct pg connection failed, trying Supabase client...');
    
    // Fall back to Supabase client
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) throw error;
      console.log('✅ Database connection successful (Supabase client)');
      return true;
    } catch (supabaseError) {
      console.error('❌ Database connection failed (both methods):', pgError);
      return false;
    }
  }
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  await pool.end();
  console.log('Database connections closed');
}
