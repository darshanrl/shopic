export const config = { runtime: 'edge' };

import { Contest } from '../../../entities/Contest';

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Contest ID required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    switch (req.method) {
      case 'DELETE':
        await Contest.delete(id);
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
}
