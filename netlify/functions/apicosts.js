exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  const ACCOUNT_ID   = "8f54718f896a4453269814ed8dba706c";
  const NAMESPACE_ID = "9c97a6d49ca74e7f9f1cf32877311e70";
  const CF_API_TOKEN = process.env.CF_KV_API_TOKEN;

  const now = new Date();
  const month = now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0');
  const prefix = `attom:calls:${month}:`;

  const ENDPOINTS = [
    { key: 'propertyapi/v1.0.0/property/basicprofile',        name: 'property/basicprofile' },
    { key: 'propertyapi/v1.0.0/avmhistory/detail',            name: 'avm/detail' },
    { key: 'propertyapi/v1.0.0/saleshistory/detail',          name: 'sale/snapshot' },
    { key: 'propertyapi/v1.0.0/property/detailmortgage',      name: 'detailmortgage' },
    { key: 'propertyapi/v1.0.0/valuation/rentalavm',          name: 'rentalavm' },
    { key: 'propertyapi/v1.0.0/preforeclosuredetails',        name: 'preforeclosuredetail' },
    { key: 'propertyapi/v1.0.0/assessmenthistory/detail',     name: 'assessmenthistory/detail' },
    { key: 'propertyapi/v1.0.0/saleshistory/expandedhistory', name: 'expandedhistory' },
    { key: 'property/detail',                                  name: 'property/detail' },
  ];

  const EXCLUDE = ['health', 'unknown'];
  const MONTHLY_BASE_COST = 500;
  const INCLUDED_CALLS = 6000;
  const OVERAGE_COST_PER_CALL = 0.15;

  try {
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/keys?prefix=${encodeURIComponent(prefix)}&limit=100`,
      { headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    const listData = await listRes.json();
    if (!listData.success) throw new Error('KV list failed: ' + JSON.stringify(listData.errors));

    const kvKeys = listData.result || [];
    const valuePromises = kvKeys.map(async (k) => {
      const valRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/values/${encodeURIComponent(k.name)}`,
        { headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` } }
      );
      const val = await valRes.text();
      return { key: k.name, count: parseInt(val || '0', 10) };
    });
    const values = await Promise.all(valuePromises);

    const countMap = {};
    values.forEach(v => {
      const endpointPath = v.key.replace(prefix, '');
      if (!EXCLUDE.includes(endpointPath)) countMap[endpointPath] = v.count;
    });

    let totalCalls = 0;
    const endpoints = ENDPOINTS.map(ep => {
      const calls = countMap[ep.key] || 0;
      totalCalls += calls;
      return { name: ep.name, calls };
    });
    endpoints.sort((a, b) => b.calls - a.calls);

    const overageCalls = Math.max(0, totalCalls - INCLUDED_CALLS);
    const totalCost = MONTHLY_BASE_COST + (overageCalls * OVERAGE_COST_PER_CALL);

    const endpointsWithCost = endpoints.map(ep => {
      const callShare = totalCalls > 0 ? ep.calls / totalCalls : 0;
      const basePortion = callShare * Math.min(totalCalls, INCLUDED_CALLS) * (MONTHLY_BASE_COST / INCLUDED_CALLS);
      const overagePortion = callShare * overageCalls * OVERAGE_COST_PER_CALL;
      return { ...ep, cost: parseFloat((basePortion + overagePortion).toFixed(2)) };
    });

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ month, endpoints: endpointsWithCost, totalCalls, totalCost: parseFloat(totalCost.toFixed(2)), includedCalls: INCLUDED_CALLS, overageCalls, monthlyCost: MONTHLY_BASE_COST, live: true })
    };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message, live: false }) };
  }
};
