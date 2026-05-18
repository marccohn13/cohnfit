// api/strava-token.js
// Vercel serverless function — keeps your Client Secret off the frontend

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CLIENT_ID     = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: 'Strava credentials not configured' });
  }

  const { code, refresh_token } = req.body;

  try {
    let body;

    if (refresh_token) {
      // Refresh an existing token
      body = new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    'refresh_token',
        refresh_token,
      });
    } else if (code) {
      // Exchange auth code for token (first login)
      body = new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
      });
    } else {
      return res.status(400).json({ error: 'Missing code or refresh_token' });
    }

    const stravaRes = await fetch('https://www.strava.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await stravaRes.json();

    if (!stravaRes.ok) {
      return res.status(stravaRes.status).json({ error: data.message || 'Strava error' });
    }

    return res.status(200).json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
