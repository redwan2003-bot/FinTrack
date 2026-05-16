import { supabase } from '../lib/supabase';

/**
 * Health Check Utility
 * Used to verify the status of critical system components.
 */
export const checkHealth = async () => {
  const results = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      supabase: { status: 'pending' },
      localState: { status: 'ok' }
    }
  };

  try {
    // 1. Supabase Check (Simple ping/version check)
    const start = Date.now();
    const { error } = await supabase.from('transactions').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is just "no rows", which is fine
        results.checks.supabase = { 
            status: 'fail', 
            error: error.message,
            latency_ms: Date.now() - start 
        };
        results.status = 'degraded';
    } else {
        results.checks.supabase = { 
            status: 'ok', 
            latency_ms: Date.now() - start 
        };
    }
  } catch (err) {
    results.checks.supabase = { status: 'fail', error: err.message };
    results.status = 'fail';
  }

  return results;
};
