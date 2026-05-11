// locations.js — reads beta search city data from Cloudflare KV
// Keys written by worker.js: attom:city:YYYY-MM:cityname_state → JSON {count, lat, lng, name, state}

const CF_ACCOUNT_ID = '8f54718f896a4453269814ed8dba706c';
const KV_NAMESPACE_ID = '9c97a6d49ca74e7f9f1cf32877311e70';

exports.handler = async function(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const token = process.env.CF_KV_API_TOKEN;
  if (!token) {
    return { statusCode: 200, headers, body: JSON.stringify({ live: false, error: 'CF_KV_API_TOKEN not set', cities: [] }) };
  }

  const now = new Date();
  const month = now.toISOString().slice(0, 7); // YYYY-MM
  const prefix = `attom:city:${month}:`;

  try {
    // List all city keys for this month
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/keys?prefix=${encodeURIComponent(prefix)}&limit=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json();

    if (!listData.success) {
      return { statusCode: 200, headers, body: JSON.stringify({ live: false, error: 'KV list failed', cities: [], month }) };
    }

    const keys = (listData.result || []).map(k => k.name);
    if (keys.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ live: true, cities: [], month }) };
    }

    // Fetch all city values in parallel
    const values = await Promise.all(keys.map(async key => {
      try {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${encodeURIComponent(key)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const text = await res.text();
        return JSON.parse(text);
      } catch(e) {
        return null;
      }
    }));

    const cities = values
      .filter(v => v && v.name && v.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ live: true, month, cities })
    };

  } catch(e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ live: false, error: e.message, cities: [], month })
    };
  }
};
