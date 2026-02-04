// api/blob/generate-upload-url.js
export const config = { runtime: 'edge' };

import { generateUploadUrl } from '@vercel/blob';

const jsonHeaders = { 'content-type': 'application/json' };
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',            // set to your origin if you want
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...jsonHeaders, ...corsHeaders },
    });
  }

  try {
    const { contentType, filename, clientPayload } = await req.json();
    const { url } = await generateUploadUrl({ contentType, clientPayload });

    return new Response(JSON.stringify({ uploadUrl: url }), {
      status: 200,
      headers: { ...jsonHeaders, ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Failed to generate upload URL' }), {
      status: 500,
      headers: { ...jsonHeaders, ...corsHeaders },
    });
  }
}
