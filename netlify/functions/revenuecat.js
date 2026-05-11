exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  const RC_KEY = process.env.REVENUECAT_SECRET_KEY;
  const PROJECT_ID = "proj984acadf";

  const rcHeaders = {
    "Authorization": `Bearer ${RC_KEY}`,
    "Content-Type": "application/json"
  };

  try {
    // 1. Overview metrics (MRR, active users, subs, new customers, revenue)
    const overviewRes = await fetch(
      `https://api.revenuecat.com/v2/projects/${PROJECT_ID}/metrics/overview`,
      { headers: rcHeaders }
    );
    const overviewData = await overviewRes.json();

    // 2. Revenue by product — Charts API
    // End date = today, start date = 30 days ago (ISO dates)
    const now = new Date();
    const endDate = now.toISOString().split("T")[0];
    const startDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const chartParams = new URLSearchParams({
      start_time: startDate,
      end_time: endDate,
      resolution: "month",
      filter: "product"
    });

    let revenueByTier = null;
    try {
      const chartRes = await fetch(
        `https://api.revenuecat.com/v2/projects/${PROJECT_ID}/charts/revenue?${chartParams}`,
        { headers: rcHeaders }
      );
      if (chartRes.ok) {
        const chartData = await chartRes.json();
        // chartData.values is an array of { date, segments: [{ product_identifier, revenue }] }
        // Aggregate across all dates to get totals per product
        const totals = {};
        const TIERS = {
          "com.ddmap.pro.annual":    { name: "Pro Annual",    color: "#00d4aa" },
          "com.ddmap.pro.monthly":   { name: "Pro Monthly",   color: "#3b7cff" },
          "com.ddmap.unlock.property": { name: "Per Property", color: "#c084fc" }
        };

        (chartData.values || []).forEach(point => {
          (point.segments || []).forEach(seg => {
            const id = seg.product_identifier;
            if (!totals[id]) totals[id] = 0;
            totals[id] += seg.revenue || 0;
          });
        });

        revenueByTier = Object.entries(TIERS).map(([id, meta]) => ({
          productId: id,
          name: meta.name,
          color: meta.color,
          revenue: totals[id] || 0
        }));
      }
    } catch (chartErr) {
      // Charts API failure is non-fatal — overview still returns
      console.error("[revenuecat] Charts API error:", chartErr.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...overviewData,
        revenueByTier
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};