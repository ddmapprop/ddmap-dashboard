const PptxGenJS = require('pptxgenjs');

// Color palette — dark navy executive theme
const C = {
  bg:       '0B0F1A',  // near-black navy
  surface:  '131928',  // card bg
  accent:   '00C9A7',  // teal green
  blue:     '3B7CFF',  // blue
  purple:   'C084FC',  // purple
  orange:   'FF6B35',  // orange
  white:    'E8EDF5',  // off-white
  muted:    '5A6478',  // muted gray
  red:      'FF4757',  // red
};

// Helper — stat callout block
function statBlock(slide, x, y, w, h, label, value, color, sub) {
  slide.addShape('rect', { x, y, w, h, fill: { color: C.surface }, line: { color: color, width: 1.5 } });
  slide.addShape('rect', { x, y, w, h: 0.04, fill: { color: color } });
  slide.addText(label.toUpperCase(), { x: x+0.18, y: y+0.18, w: w-0.36, h: 0.22, fontSize: 8, color: C.muted, fontFace: 'Calibri', charSpacing: 2, margin: 0 });
  slide.addText(value, { x: x+0.18, y: y+0.38, w: w-0.36, h: 0.55, fontSize: 28, bold: true, color: color, fontFace: 'Calibri', margin: 0 });
  if(sub) slide.addText(sub, { x: x+0.18, y: y+0.9, w: w-0.36, h: 0.2, fontSize: 9, color: C.muted, fontFace: 'Calibri', margin: 0 });
}

// Helper — section label
function sectionLabel(slide, x, y, text, color) {
  slide.addText(text.toUpperCase(), { x, y, w: 9, h: 0.22, fontSize: 9, color: color || C.accent, fontFace: 'Calibri', charSpacing: 3, margin: 0 });
}

exports.handler = async function(event, context) {
  if(event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || '{}'); } catch(e) {}

  const mrr = payload.mrr || '$0';
  const users = payload.users || '0';
  const subs = payload.subs || '0';
  const apiCost = payload.apiCost || '$500';
  const openCrashes = parseInt(payload.openCrashes || '0', 10);
  const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE'; // 13.3" × 7.5"
  pres.title = 'DDmap — Investor Overview';
  pres.author = 'Solstice Holdings Group LLC';

  // ─── SLIDE 1: COVER ───────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };

    // Left accent bar
    s.addShape('rect', { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.accent } });

    // Logo / wordmark
    s.addText('DDmap', { x: 0.5, y: 1.6, w: 7, h: 1.1, fontSize: 72, bold: true, color: C.white, fontFace: 'Calibri', margin: 0 });
    s.addText('Property Intelligence Platform', { x: 0.5, y: 2.7, w: 8, h: 0.45, fontSize: 20, color: C.accent, fontFace: 'Calibri', margin: 0 });

    // Tagline
    s.addText('Institutional-grade real estate data for every investor.', {
      x: 0.5, y: 3.35, w: 9, h: 0.4, fontSize: 15, color: C.muted, fontFace: 'Calibri', italic: true, margin: 0
    });

    // Divider
    s.addShape('rect', { x: 0.5, y: 3.9, w: 5, h: 0.03, fill: { color: C.muted } });

    // Meta
    s.addText('Confidential · Solstice Holdings Group LLC · ' + today, {
      x: 0.5, y: 4.15, w: 9, h: 0.3, fontSize: 10, color: C.muted, fontFace: 'Calibri', margin: 0
    });

    // Right side — key stats preview
    statBlock(s, 9.8, 1.6, 3.0, 1.25, 'MRR', mrr, C.accent, 'Monthly Recurring Revenue');
    statBlock(s, 9.8, 3.0, 3.0, 1.25, 'Active Users', users, C.blue, 'Last 28 days');
    statBlock(s, 9.8, 4.4, 3.0, 1.25, 'Platform', 'iOS', C.purple, 'App Store · SwiftUI');
  }

  // ─── SLIDE 2: THE OPPORTUNITY ────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape('rect', { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.orange } });

    sectionLabel(s, 0.5, 0.4, 'The Opportunity', C.orange);
    s.addText('A $22 trillion market with no institutional-grade mobile tool.', {
      x: 0.5, y: 0.75, w: 12.3, h: 0.75, fontSize: 28, bold: true, color: C.white, fontFace: 'Calibri', margin: 0
    });

    const points = [
      { stat: '17M+', label: 'Independent real estate investors in the US', sub: 'No dedicated intelligence platform serves them on mobile.' },
      { stat: '$22T', label: 'US residential real estate market', sub: 'The largest asset class in the world — underserved by consumer tools.' },
      { stat: '$10K–$50K/yr', label: 'Cost of institutional data access today', sub: 'ATTOM, CoStar, Bloomberg — locked behind enterprise contracts. DDmap changes that.' },
      { stat: '0', label: 'Competing iOS apps with institutional-depth property intelligence', sub: 'The category is wide open. DDmap is first to market with this depth of data.' },
    ];

    points.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.4;
      const y = 1.75 + row * 2.5;
      s.addShape('rect', { x, y, w: 6.1, h: 2.3, fill: { color: C.surface }, line: { color: C.orange, width: 1.0 } });
      s.addShape('rect', { x, y, w: 6.1, h: 0.04, fill: { color: C.orange } });
      s.addText(p.stat, { x: x+0.2, y: y+0.18, w: 5.7, h: 0.75, fontSize: 42, bold: true, color: C.orange, fontFace: 'Calibri', margin: 0 });
      s.addText(p.label, { x: x+0.2, y: y+0.95, w: 5.7, h: 0.38, fontSize: 13, bold: true, color: C.white, fontFace: 'Calibri', margin: 0 });
      s.addText(p.sub, { x: x+0.2, y: y+1.38, w: 5.7, h: 0.75, fontSize: 11, color: C.muted, fontFace: 'Calibri', margin: 0 });
    });
  }

  // ─── SLIDE 3: THE SOLUTION ────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape('rect', { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.accent } });

    sectionLabel(s, 0.5, 0.4, 'The Solution');
    s.addText('Bloomberg for real estate — in your pocket.', {
      x: 0.5, y: 0.75, w: 12.3, h: 0.75, fontSize: 30, bold: true, color: C.white, fontFace: 'Calibri', margin: 0
    });

    const features = [
      { title: 'Distress Score', desc: 'Proprietary pre-foreclosure signal combining equity, assessment, and delinquency data.' },
      { title: 'Equity Velocity', desc: 'Tracks equity build rate vs. comp appreciation to surface motivated sellers.' },
      { title: 'Comparable Value Confidence', desc: 'Scores AVM reliability against recent sales radius — flags thin comps markets.' },
      { title: 'Rent-to-Price Ratio', desc: 'Live rental AVM vs. AVM for instant cash-on-cash signal.' },
      { title: 'Value vs. Assessment Gap', desc: 'Surfaces properties where assessed value lags market — tax appeal opportunity.' },
      { title: 'Neighborhood Momentum Score', desc: 'Aggregates sale velocity, price trends, and days-on-market across census tracts.' },
    ];

    features.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.4;
      const y = 1.75 + row * 1.55;
      s.addShape('rect', { x, y, w: 6.1, h: 1.35, fill: { color: C.surface }, line: { color: C.accent, width: 0.75 } });
      s.addShape('rect', { x, y, w: 6.1, h: 0.04, fill: { color: C.accent } });
      s.addText(f.title, { x: x+0.18, y: y+0.15, w: 5.7, h: 0.35, fontSize: 13, bold: true, color: C.accent, fontFace: 'Calibri', margin: 0 });
      s.addText(f.desc, { x: x+0.18, y: y+0.52, w: 5.7, h: 0.65, fontSize: 11, color: C.muted, fontFace: 'Calibri', margin: 0 });
    });
  }

  // ─── SLIDE 4: TRACTION ────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape('rect', { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.blue } });

    sectionLabel(s, 0.5, 0.4, 'Traction', C.blue);
    s.addText('Early metrics — pre-marketing, organic only.', {
      x: 0.5, y: 0.75, w: 12.3, h: 0.55, fontSize: 24, bold: true, color: C.white, fontFace: 'Calibri', margin: 0
    });

    // Big stat blocks
    statBlock(s, 0.5,  1.55, 3.0, 1.3, 'MRR',          mrr,   C.accent, 'Monthly Recurring Revenue');
    statBlock(s, 3.75, 1.55, 3.0, 1.3, 'Active Users',  users, C.blue,   '28-day window');
    statBlock(s, 7.0,  1.55, 3.0, 1.3, 'Subscriptions', subs,  C.purple, 'Paid tiers active');
    statBlock(s, 10.25,1.55, 2.6, 1.3, 'Crash-Free',    openCrashes === 0 ? '100%' : '—', C.accent, 'Firebase Crashlytics');

    // Milestones
    sectionLabel(s, 0.5, 3.15, 'Key Milestones', C.blue);
    const milestones = [
      { date: 'Feb 2026', text: 'DDmap US LLC formed · Wyoming · under Solstice Holdings Group LLC' },
      { date: 'Mar 2026', text: 'ATTOM Data Premium Property Package contract signed · 9 endpoints' },
      { date: 'Mar 2026', text: 'Cloudflare Worker proxy deployed · RevenueCat SDK integrated · Firebase Crashlytics live' },
      { date: 'Apr 2026', text: 'Mercury banking established · Apple Developer enrolled · TestFlight onboarding' },
      { date: 'May 2026', text: 'Command Center dashboard live · KV API cost logging · Firebase crash monitoring' },
    ];

    milestones.forEach((m, i) => {
      const y = 3.55 + i * 0.72;
      s.addShape('rect', { x: 0.5, y: y+0.1, w: 0.08, h: 0.42, fill: { color: C.blue } });
      s.addText(m.date, { x: 0.75, y, w: 1.4, h: 0.3, fontSize: 9, color: C.blue, fontFace: 'Calibri', bold: true, margin: 0 });
      s.addText(m.text, { x: 0.75, y: y+0.28, w: 12, h: 0.3, fontSize: 11, color: C.muted, fontFace: 'Calibri', margin: 0 });
    });
  }

  // ─── SLIDE 5: BUSINESS MODEL ──────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape('rect', { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.purple } });

    sectionLabel(s, 0.5, 0.4, 'Business Model', C.purple);
    s.addText('Three revenue streams. One platform.', {
      x: 0.5, y: 0.75, w: 12.3, h: 0.55, fontSize: 24, bold: true, color: C.white, fontFace: 'Calibri', margin: 0
    });

    const tiers = [
      { name: 'Free', price: '$0', desc: '5 demo properties · No API calls · Onboarding paywall', color: C.muted },
      { name: 'Per Property', price: '$2.99', desc: 'Single property unlock · Full ATTOM data · No subscription required', color: C.accent },
      { name: 'Pro Monthly', price: '$12.50/mo', desc: 'Unlimited searches · Share & PDF export · All 6 DDmap metrics', color: C.blue },
      { name: 'Pro Annual', price: '$99/yr', desc: 'Best value · $8.25/mo effective · Full Pro feature set', color: C.purple },
    ];

    tiers.forEach((t, i) => {
      const x = 0.5 + i * 3.2;
      s.addShape('rect', { x, y: 1.55, w: 3.0, h: 3.5, fill: { color: C.surface }, line: { color: t.color, width: 1.5 } });
      s.addShape('rect', { x, y: 1.55, w: 3.0, h: 0.05, fill: { color: t.color } });
      s.addText(t.name, { x: x+0.18, y: 1.75, w: 2.64, h: 0.4, fontSize: 14, bold: true, color: t.color, fontFace: 'Calibri', margin: 0 });
      s.addText(t.price, { x: x+0.18, y: 2.2, w: 2.64, h: 0.65, fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri', margin: 0 });
      s.addText(t.desc, { x: x+0.18, y: 2.95, w: 2.64, h: 1.8, fontSize: 11, color: C.muted, fontFace: 'Calibri', margin: 0 });
    });

    // Unit economics
    sectionLabel(s, 0.5, 5.35, 'Unit Economics', C.purple);
    s.addShape('rect', { x: 0.5, y: 5.65, w: 12.3, h: 1.55, fill: { color: C.surface }, line: { color: C.muted, width: 0.5 } });
    const econ = [
      { label: 'Apple 30% cut', val: 'Year 1', sub: '15% after 12mo' },
      { label: 'ATTOM Data', val: '$500/mo', sub: '6K calls included' },
      { label: 'Gross Margin (target)', val: '70%+', sub: 'At scale' },
      { label: 'CAC', val: '~$0', sub: 'Organic only' },
    ];
    econ.forEach((e, i) => {
      const x = 0.7 + i * 3.1;
      s.addText(e.label, { x, y: 5.8, w: 2.8, h: 0.28, fontSize: 9, color: C.muted, fontFace: 'Calibri', charSpacing: 1, margin: 0 });
      s.addText(e.val, { x, y: 6.1, w: 2.8, h: 0.45, fontSize: 20, bold: true, color: C.white, fontFace: 'Calibri', margin: 0 });
      s.addText(e.sub, { x, y: 6.55, w: 2.8, h: 0.25, fontSize: 9, color: C.muted, fontFace: 'Calibri', margin: 0 });
    });
  }

  // ─── SLIDE 6: TECHNOLOGY ──────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape('rect', { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.accent } });

    sectionLabel(s, 0.5, 0.4, 'Technology Stack');
    s.addText('Institutional data. Consumer experience.', {
      x: 0.5, y: 0.75, w: 12.3, h: 0.55, fontSize: 24, bold: true, color: C.white, fontFace: 'Calibri', margin: 0
    });

    const stack = [
      { cat: 'Data', items: ['ATTOM Data Solutions — Premium Property Package', '9 endpoints: AVM, ownership, equity, preforeclosure, rentals, schools', 'Cloudflare Worker proxy — API key never exposed to client'] },
      { cat: 'App', items: ['SwiftUI · iOS native', 'SwiftData persistent caching — 30d ownership / 7d AVM', 'RevenueCat SDK v5.69 · Firebase Crashlytics v12'] },
      { cat: 'Infrastructure', items: ['Cloudflare Workers (ATTOM proxy + KV cost logging)', 'Netlify (dashboard + serverless functions)', 'Mercury Banking · Apple Developer Program'] },
      { cat: 'Security', items: ['Cloudflare Zero Trust on Command Center', 'Certificate pinning (planned pre-launch)', 'Server-side receipt validation via RevenueCat (planned)'] },
    ];

    stack.forEach((g, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.5 + col * 6.4;
      const y = 1.55 + row * 2.5;
      s.addShape('rect', { x, y, w: 6.1, h: 2.3, fill: { color: C.surface }, line: { color: C.muted, width: 0.5 } });
      s.addText(g.cat.toUpperCase(), { x: x+0.18, y: y+0.15, w: 5.7, h: 0.28, fontSize: 9, color: C.accent, fontFace: 'Calibri', charSpacing: 2, bold: true, margin: 0 });
      g.items.forEach((item, j) => {
        s.addText('— ' + item, { x: x+0.18, y: y+0.5+j*0.52, w: 5.7, h: 0.45, fontSize: 11, color: C.muted, fontFace: 'Calibri', margin: 0 });
      });
    });
  }

  // ─── SLIDE 7: VALUATION ───────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape('rect', { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.orange } });

    sectionLabel(s, 0.5, 0.4, 'Valuation', C.orange);
    s.addText('Implied range across four methodologies.', {
      x: 0.5, y: 0.75, w: 12.3, h: 0.55, fontSize: 24, bold: true, color: C.white, fontFace: 'Calibri', margin: 0
    });

    // Headline range
    s.addShape('rect', { x: 0.5, y: 1.5, w: 12.3, h: 1.4, fill: { color: C.surface }, line: { color: C.orange, width: 1.5 } });
    s.addShape('rect', { x: 0.5, y: 1.5, w: 12.3, h: 0.05, fill: { color: C.orange } });
    s.addText('Implied Valuation Range', { x: 0.7, y: 1.65, w: 5, h: 0.3, fontSize: 10, color: C.muted, fontFace: 'Calibri', charSpacing: 2, margin: 0 });
    s.addText('$156K – $562K', { x: 0.7, y: 1.9, w: 8, h: 0.75, fontSize: 44, bold: true, color: C.orange, fontFace: 'Calibri', margin: 0 });
    s.addText('Blended across MRR multiple, ARR multiple, DCF (5yr/15%), and user-based', { x: 8, y: 2.05, w: 4.5, h: 0.5, fontSize: 10, color: C.muted, fontFace: 'Calibri', italic: true, margin: 0 });

    // Methodology table
    const methods = [
      { name: 'MRR Multiple Bear', mult: '36×', basis: mrr, value: '$11.2K', color: C.red },
      { name: 'MRR Multiple Base', mult: '75×', basis: mrr, value: '$23.4K', color: C.accent },
      { name: 'MRR Multiple Bull', mult: '120×', basis: mrr, value: '$37.4K', color: C.purple },
      { name: 'ARR Multiple Bear', mult: '3× ARR', basis: '—', value: '$11.2K', color: C.red },
      { name: 'ARR Multiple Base', mult: '6× ARR', basis: '—', value: '$22.5K', color: C.accent },
      { name: 'ARR Multiple Bull', mult: '12× ARR', basis: '—', value: '$44.9K', color: C.purple },
      { name: 'DCF (5yr, 15% discount)', mult: '80% YoY yr1', basis: '—', value: '$194K', color: C.orange },
      { name: 'User-Based ($200/MAU)', mult: '$200/MAU', basis: users + ' users', value: '$169K', color: C.blue },
    ];

    // Header
    s.addShape('rect', { x: 0.5, y: 3.1, w: 12.3, h: 0.32, fill: { color: C.surface } });
    s.addText('Scenario', { x: 0.65, y: 3.15, w: 5, h: 0.22, fontSize: 9, color: C.muted, fontFace: 'Calibri', charSpacing: 1, margin: 0 });
    s.addText('Multiple', { x: 6.5, y: 3.15, w: 2, h: 0.22, fontSize: 9, color: C.muted, fontFace: 'Calibri', charSpacing: 1, align: 'right', margin: 0 });
    s.addText('Value', { x: 10.5, y: 3.15, w: 2, h: 0.22, fontSize: 9, color: C.muted, fontFace: 'Calibri', charSpacing: 1, align: 'right', margin: 0 });

    methods.forEach((m, i) => {
      const y = 3.42 + i * 0.48;
      if(i % 2 === 0) s.addShape('rect', { x: 0.5, y, w: 12.3, h: 0.46, fill: { color: C.surface } });
      s.addText(m.name, { x: 0.65, y: y+0.1, w: 5.5, h: 0.28, fontSize: 11, color: C.white, fontFace: 'Calibri', margin: 0 });
      s.addText(m.mult, { x: 6.5, y: y+0.1, w: 2, h: 0.28, fontSize: 11, color: C.muted, fontFace: 'Calibri', align: 'right', margin: 0 });
      s.addText(m.value, { x: 10.5, y: y+0.1, w: 2, h: 0.28, fontSize: 13, bold: true, color: m.color, fontFace: 'Calibri', align: 'right', margin: 0 });
    });
  }

  // ─── SLIDE 8: CLOSING ─────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.bg };
    s.addShape('rect', { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: C.accent } });

    s.addText('DDmap', { x: 0.5, y: 1.5, w: 8, h: 0.9, fontSize: 56, bold: true, color: C.white, fontFace: 'Calibri', margin: 0 });
    s.addText('The property intelligence platform built for serious investors.', {
      x: 0.5, y: 2.45, w: 10, h: 0.55, fontSize: 18, color: C.accent, fontFace: 'Calibri', italic: true, margin: 0
    });

    s.addShape('rect', { x: 0.5, y: 3.2, w: 4.5, h: 0.03, fill: { color: C.muted } });

    s.addText('Patrick Carney', { x: 0.5, y: 3.45, w: 6, h: 0.38, fontSize: 16, bold: true, color: C.white, fontFace: 'Calibri', margin: 0 });
    s.addText('Solstice Holdings Group LLC · DDmap US LLC', { x: 0.5, y: 3.85, w: 8, h: 0.3, fontSize: 12, color: C.muted, fontFace: 'Calibri', margin: 0 });
    s.addText('ddmap.us · slhgrp.com', { x: 0.5, y: 4.2, w: 6, h: 0.3, fontSize: 12, color: C.accent, fontFace: 'Calibri', margin: 0 });

    s.addText('Confidential & Proprietary · Not for distribution · ' + today, {
      x: 0.5, y: 6.9, w: 12, h: 0.3, fontSize: 9, color: C.muted, fontFace: 'Calibri', margin: 0
    });

    // Right side summary stats
    statBlock(s, 9.8, 1.5,  3.0, 1.2, 'MRR',    mrr,   C.accent, '');
    statBlock(s, 9.8, 2.85, 3.0, 1.2, 'Users',   users, C.blue,   '28-day active');
    statBlock(s, 9.8, 4.2,  3.0, 1.2, 'Founded', '2026', C.purple, 'Wyoming · Florida');
  }

  // Write to buffer and return as binary
  const buffer = await pres.write({ outputType: 'arraybuffer' });
  const base64 = Buffer.from(buffer).toString('base64');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': 'attachment; filename="DDmap_Pitch_Deck.pptx"',
      'Access-Control-Allow-Origin': '*',
    },
    body: base64,
    isBase64Encoded: true,
  };
};
