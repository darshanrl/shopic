// api/blob/generate-upload-url.js
export const config = { runtime: 'edge' };

import { generateUploadUrl } from '@vercel/blob';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const { contentType, filename, clientPayload } = await req.json();

    const { url } = await generateUploadUrl({
      contentType,
      clientPayload, // optional passthrough metadata
    });

    return new Response(JSON.stringify({ uploadUrl: url }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Failed to generate upload URL' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
