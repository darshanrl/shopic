export const config = { runtime: 'edge' };
export default async function handler() {
  const hasToken = !!(process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.length > 10);
  return new Response(JSON.stringify({
    ok: true,
    hasToken,
    env: process.env.VERCEL_ENV || 'unknown',
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}
