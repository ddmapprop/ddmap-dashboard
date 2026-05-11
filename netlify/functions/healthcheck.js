exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  const check = async (name, url, options = {}) => {
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        signal: AbortSignal.timeout(5000)
      });
      const ms = Date.now() - start;
      // 401/403 = server is up, just needs auth
      const ok = res.status < 500;
      return { name, status: ok ? 'operational' : 'error', ms, code: res.status };
    } catch(e) {
      return { name, status: 'error', ms: null, code: null, error: e.message };
    }
  };

  const results = await Promise.all([
    check('attom', 'https://api.attomdata.com/propertyapi/v1.0.0/property/basicprofile'),
    check('revenuecat', 'https://api.revenuecat.com/v1/subscribers/health'),
    check('worker', 'https://ddmap-attom-proxy.pcarney65.workers.dev/health'),
    check('netlify', 'https://ddmap.us'),
    check('appstore', 'https://appstoreconnect.apple.com'),
  ]);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ checked_at: new Date().toISOString(), services: results })
  };
};