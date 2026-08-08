export async function fetchHealth(baseUrl: string) { const res = await fetch(`${baseUrl}/api/health`); return res.json(); }
