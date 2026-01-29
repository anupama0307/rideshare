import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { pool, supabase } from '../config/database.js';
import { logger } from '../config/logger.js';

// Flag to track if we should use Supabase client (set when pg fails)
let useSupabaseClient = true; // Default to Supabase since pg connection fails

// Base repository with common database operations
export abstract class BaseRepository<T extends QueryResultRow> {
  protected pool: Pool = pool;
  protected abstract tableName: string;

  // Get a client for transactions
  protected async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  // Execute a query using Supabase client
  protected async query<R extends QueryResultRow = T & QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<R>> {
    const start = Date.now();

    // Try to use pg pool first if not flagged to use Supabase
    if (!useSupabaseClient) {
      try {
        const result = await this.pool.query<R>(text, params);
        const duration = Date.now() - start;
        logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 100)}...`);
        return result;
      } catch (error: any) {
        if (error.code === 'ENOTFOUND' || error.message?.includes('Tenant')) {
          logger.warn('Switching to Supabase client due to pg connection failure');
          useSupabaseClient = true;
        } else {
          logger.error(`Query failed: ${text}`, { error, params });
          throw error;
        }
      }
    }

    // Use Supabase client as fallback - execute raw SQL via rpc
    // For simple SELECT queries, we'll use the Supabase query builder instead
    logger.debug(`Using Supabase client for query: ${text.substring(0, 100)}...`);

    // Parse the query to understand what operation to perform
    // This is a simplified approach - complex queries may need rpc functions
    const selectMatch = text.match(/SELECT \* FROM (\w+) WHERE (\w+) = \$1/i);
    if (selectMatch) {
      const table = selectMatch[1];
      const column = selectMatch[2];
      const { data, error } = await supabase
        .from(table!)
        .select('*')
        .eq(column!, params?.[0])
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return {
        rows: data ? [data as R] : [],
        rowCount: data ? 1 : 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      };
    }

    // For INSERT queries
    const insertMatch = text.match(/INSERT INTO (\w+)/i);
    if (insertMatch) {
      // This needs to be handled in specific repository methods
      throw new Error('INSERT queries should use Supabase client directly in repository');
    }

    // For UPDATE queries on users table
    const updateMatch = text.match(/UPDATE users SET[\s\S]*?WHERE id = \$(\d+)/i);
    if (updateMatch) {
      // Extract the user id from params (it's the last param)
      const idParamIndex = parseInt(updateMatch[1]!) - 1;
      const userId = params?.[idParamIndex];

      // Build update object from query - parse the SET clause
      const setClause = text.match(/SET ([\s\S]+?) WHERE/i)?.[1] || '';
      const updateData: Record<string, any> = {};

      // Parse each field assignment
      let paramIndex = 0;
      const assignments = setClause.split(',').map(s => s.trim());
      for (const assignment of assignments) {
        const fieldMatch = assignment.match(/(\w+)\s*=\s*\$(\d+)/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1]!;
          const pIdx = parseInt(fieldMatch[2]!) - 1;
          updateData[fieldName] = params?.[pIdx];
        } else if (assignment.includes('NOW()')) {
          // Handle updated_at = NOW()
          const fieldName = assignment.split('=')[0]?.trim();
          if (fieldName) {
            updateData[fieldName] = new Date().toISOString();
          }
        }
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        logger.error('Supabase update error:', error);
        throw error;
      }

      return {
        rows: data ? [data as R] : [],
        rowCount: data ? 1 : 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      };
    }

    throw new Error(`Query not supported in Supabase fallback mode: ${text.substring(0, 50)}`);
  }

  // Execute within a transaction
  protected async withTransaction<R>(
    callback: (client: PoolClient) => Promise<R>
  ): Promise<R> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Find by ID
  async findById(id: string): Promise<T | null> {
    if (useSupabaseClient) {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as T | null;
    }

    const result = await this.query<T>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  // Delete by ID
  async deleteById(id: string): Promise<boolean> {
    if (useSupabaseClient) {
      const { error, count } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return (count ?? 0) > 0;
    }

    const result = await this.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // Count records
  async count(where?: string, params?: unknown[]): Promise<number> {
    if (useSupabaseClient) {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    }

    const whereClause = where ? `WHERE ${where}` : '';
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`,
      params
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }
}

