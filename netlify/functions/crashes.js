const admin = require('firebase-admin');

// Initialize Firebase Admin SDK once (Netlify functions are warm-cached)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  try {
    // Crashlytics REST API via Google API — requires an OAuth2 access token
    // from the service account, then calls the Crashlytics API v1alpha1
    const token = await admin.app().options.credential.getAccessToken();
    const accessToken = token.access_token;

    const projectId = 'ddmap-8ba65';
    const appId = '1:104701335286444294456:ios:' + projectId; // will resolve below

    // First: get the Firebase app ID for the iOS app
    const appsRes = await fetch(
      `https://firebase.googleapis.com/v1beta1/projects/${projectId}/iosApps`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const appsData = await appsRes.json();
    const iosApp = (appsData.apps || [])[0];
    const iosAppId = iosApp?.appId;

    if (!iosAppId) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ issues: [], totalIssues: 0, error: 'No iOS app found in project', live: false })
      };
    }

    // Fetch open Crashlytics issues
    const issuesRes = await fetch(
      `https://firebaseappdistribution.googleapis.com/v1/projects/${projectId}/apps/${iosAppId}/releases`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    // Use the Crashlytics v1alpha1 endpoint for error issues
    const crashRes = await fetch(
      `https://firebase.googleapis.com/v1alpha/projects/${projectId}/apps/${iosAppId}/errorIssues?pageSize=10`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    let issues = [];
    let totalIssues = 0;

    if (crashRes.ok) {
      const crashData = await crashRes.json();
      const rawIssues = crashData.errorIssues || [];
      totalIssues = rawIssues.length;

      issues = rawIssues.map(issue => ({
        id: issue.name || '',
        title: issue.subtitle || issue.title || 'Unknown crash',
        type: issue.type || 'CRASH',
        impactedUsers: issue.impactedUsersCount || 0,
        occurrences: issue.eventsCount || 0,
        firstSeen: issue.firstSeenTime || null,
        lastSeen: issue.lastSeenTime || null,
        status: issue.state || 'OPEN',
      }));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        issues,
        totalIssues,
        openIssues: issues.filter(i => i.status === 'OPEN').length,
        live: true,
        appId: iosAppId,
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message, issues: [], totalIssues: 0, live: false })
    };
  }
};
