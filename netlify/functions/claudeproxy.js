// claudeproxy.js — proxies Claude API calls server-side so the key stays in Netlify env vars
exports.handler = async function(event, context) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { ...headers, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured in Netlify env vars' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { prompt, title } = body;
    if (!prompt) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt' }) };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Claude API error');

    const text = data.content?.map(b => b.text || '').join('') || 'No response.';
    return { statusCode: 200, headers, body: JSON.stringify({ text }) };

  } catch(e) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: e.message }) };
  }
};
