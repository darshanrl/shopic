export const config = { runtime: 'edge' };

import { Contest } from '../../../entities/Contest';
import { supabase } from '../../../lib/supabase';

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Contest ID required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Verify user is authenticated and admin
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    // Get user from auth token
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (userError || !userData?.is_admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Set auth context for RLS
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    });

    try {
      switch (req.method) {
        case 'DELETE':
          console.log('API: Deleting contest with ID:', id);
          await Contest.delete(id);
          console.log('API: Contest deleted successfully');
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
          
        case 'PUT':
        case 'PATCH':
          const updates = await req.json();
          await Contest.update(id, updates);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
          
        default:
          return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'content-type': 'application/json' },
          });
      }
    } catch (error) {
      console.error('Contest operation error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Operation failed' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
