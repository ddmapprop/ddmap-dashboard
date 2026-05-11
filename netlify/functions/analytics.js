// analytics.js — queries PostHog for DAU, funnel, top screens, cache hit rate
const POSTHOG_HOST = 'https://us.posthog.com';
const PROJECT_ID   = '414891';

async function query(sql, token) {
  const res = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: sql } })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'PostHog query failed');
  return data.results || [];
}

exports.handler = async function(event, context) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const token = process.env.POSTHOG_API_KEY;

  if (!token) {
    return { statusCode: 200, headers, body: JSON.stringify({ live: false, error: 'POSTHOG_API_KEY not set' }) };
  }

  try {
    const [dauRows, funnelRows, screensRows, cacheRows] = await Promise.all([

      // DAU — daily app_open counts, last 30 days
      query(`
        SELECT toDate(timestamp) as day, count() as cnt
        FROM events
        WHERE event = 'app_open'
        AND timestamp >= now() - INTERVAL 30 DAY
        GROUP BY day
        ORDER BY day ASC
      `, token),

      // Funnel — event counts for each step, last 30 days
      query(`
        SELECT
          countIf(event = 'app_open')          as app_opens,
          countIf(event = 'property_searched') as searches,
          countIf(event = 'paywall_viewed')    as paywall_views,
          countIf(event = 'purchase_completed') as purchases
        FROM events
        WHERE timestamp >= now() - INTERVAL 30 DAY
      `, token),

      // Top screens — screen_view by screen_name, last 7 days
      query(`
        SELECT properties.screen_name as screen, count() as cnt
        FROM events
        WHERE event = 'screen_view'
        AND timestamp >= now() - INTERVAL 7 DAY
        GROUP BY screen
        ORDER BY cnt DESC
        LIMIT 8
      `, token),

      // Cache hit rate — last 30 days
      query(`
        SELECT
          countIf(event = 'cache_hit')  as hits,
          countIf(event = 'cache_miss') as misses
        FROM events
        WHERE event IN ('cache_hit', 'cache_miss')
        AND timestamp >= now() - INTERVAL 30 DAY
      `, token),

    ]);

    // DAU — fill gaps for all 30 days
    const dauMap = {};
    dauRows.forEach(r => { dauMap[r[0]] = parseInt(r[1]) || 0; });
    const dau = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dau.push({ date: key, count: dauMap[key] || 0 });
    }

    // Funnel
    const f = funnelRows[0] || [0, 0, 0, 0];
    const appOpens    = parseInt(f[0]) || 0;
    const searches    = parseInt(f[1]) || 0;
    const paywallViews= parseInt(f[2]) || 0;
    const purchases   = parseInt(f[3]) || 0;
    const funnel = [
      { label: 'App Open',          count: appOpens,     pct: 100 },
      { label: 'Property Searched', count: searches,     pct: appOpens > 0 ? Math.round(searches / appOpens * 100) : 0 },
      { label: 'Paywall Seen',      count: paywallViews, pct: appOpens > 0 ? Math.round(paywallViews / appOpens * 100) : 0 },
      { label: 'Converted Paid',    count: purchases,    pct: appOpens > 0 ? Math.round(purchases / appOpens * 100) : 0 },
    ];

    // Trial→Paid conv rate
    const convRate = paywallViews > 0 ? Math.round(purchases / paywallViews * 100) : 0;

    // Top screens
    const screens = screensRows.map(r => ({ name: r[0] || 'Unknown', count: parseInt(r[1]) || 0 }));

    // Cache
    const cacheRow  = cacheRows[0] || [0, 0];
    const hits   = parseInt(cacheRow[0]) || 0;
    const misses = parseInt(cacheRow[1]) || 0;
    const total  = hits + misses;
    const cacheHitRate = total > 0 ? Math.round(hits / total * 100) : null;
    const callsSaved   = hits;
    const dollarsSaved = (hits * (500 / 6000)).toFixed(2); // $500/6000 calls = $0.0833/call

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        live: true,
        dau,
        funnel,
        convRate,
        screens,
        cacheHitRate,
        callsSaved,
        dollarsSaved,
      })
    };

  } catch(e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ live: false, error: e.message })
    };
  }
};
