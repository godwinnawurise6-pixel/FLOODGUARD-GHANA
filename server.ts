import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DEMO_REPORTS, INITIAL_FLOOD_ZONES, OFFICIAL_EMERGENCY_CONTACTS, INITIAL_SYSTEM_ANALYTICS } from './src/data/ghanaData.js';
import { FloodReport, ResponseTask } from './src/types.js';
import { fetchGhanaWeather } from './src/services/weatherService.js';
import { calculateFloodAwareRoutes } from './src/services/routingService.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory data store seeded with initial demo dataset
  let reportsStore: FloodReport[] = [...INITIAL_DEMO_REPORTS];
  let tasksStore: ResponseTask[] = [
    {
      id: 'task-101',
      reportId: 'rep-101',
      assignedTeam: 'NADMO Rapid Response Team A',
      status: 'responding',
      notes: 'Dispatched 2 high-capacity water pumps and inflatable rescue boats to Odawna VIP bus station.',
      assignedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    }
  ];

  // --- API ROUTES ---

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'FloodGuard Ghana Platform API',
      region: 'Accra, Ghana',
      version: '1.0.0-MVP',
      timestamp: new Date().toISOString()
    });
  });

  // Weather Endpoint
  app.get('/api/weather', async (req, res) => {
    const lat = parseFloat(req.query.lat as string) || 5.6037;
    const lng = parseFloat(req.query.lng as string) || -0.1870;
    const weather = await fetchGhanaWeather(lat, lng);
    res.json(weather);
  });

  // Get Reports (with status and type filters)
  app.get('/api/reports', (req, res) => {
    const { type, status, suburb } = req.query;
    let filtered = [...reportsStore];

    if (type) {
      filtered = filtered.filter(r => r.type === type);
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    if (suburb) {
      filtered = filtered.filter(r => r.suburb.toLowerCase().includes((suburb as string).toLowerCase()));
    }

    res.json({
      success: true,
      count: filtered.length,
      reports: filtered
    });
  });

  // Submit New Flood or Blocked Drain Report
  app.post('/api/reports', (req, res) => {
    const body = req.body;
    if (!body.latitude || !body.longitude || !body.description) {
      return res.status(400).json({ error: 'Missing required GPS coordinates or description.' });
    }

    const newReport: FloodReport = {
      id: `rep-${Date.now()}`,
      userId: body.userId || 'user-anonymous',
      reporterName: body.reporterName || 'Ghana Citizen',
      reporterPhone: body.reporterPhone || '',
      isAnonymous: body.isAnonymous ?? false,
      type: body.type || 'flood',
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      address: body.address || 'Accra Location',
      suburb: body.suburb || 'Accra Central',
      description: body.description,
      severity: body.severity || 'MODERATE',
      waterDepthCm: Number(body.waterDepthCm || 0),
      roadPassable: body.roadPassable || 'caution',
      housesAffected: Boolean(body.housesAffected),
      drainProblemType: body.drainProblemType,
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
      status: 'pending',
      verificationScore: 65,
      confidenceFactors: ['Citizen Submission', 'Geolocated GPS match', 'Pending Authority Review'],
      upvotes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reportsStore.unshift(newReport);
    res.status(201).json({ success: true, report: newReport });
  });

  // Verify / Reject / Resolve Report (Authority or Admin)
  app.post('/api/reports/:id/verify', (req, res) => {
    const { id } = req.params;
    const { status, verificationScore, assignedTo, notes } = req.body;

    const report = reportsStore.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (status) report.status = status;
    if (verificationScore !== undefined) report.verificationScore = Number(verificationScore);
    if (assignedTo) report.assignedTo = assignedTo;
    report.updatedAt = new Date().toISOString();

    if (notes && assignedTo) {
      tasksStore.push({
        id: `task-${Date.now()}`,
        reportId: report.id,
        assignedTeam: assignedTo,
        status: 'assigned',
        notes,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    res.json({ success: true, report });
  });

  // Flood Risk Zones Endpoint
  app.get('/api/flood-zones', (req, res) => {
    res.json({ success: true, zones: INITIAL_FLOOD_ZONES });
  });

  // Safe Route Calculation
  app.post('/api/safe-routes', (req, res) => {
    const { fromName, fromLat, fromLng, toName, toLat, toLng } = req.body;
    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({ error: 'Missing coordinates for routing.' });
    }

    const routes = calculateFloodAwareRoutes({
      fromName: fromName || 'Origin',
      fromLat: Number(fromLat),
      fromLng: Number(fromLng),
      toName: toName || 'Destination',
      toLat: Number(toLat),
      toLng: Number(toLng),
      activeReports: reportsStore
    });

    res.json({ success: true, routes });
  });

  // Emergency Contacts Endpoint
  app.get('/api/emergency-contacts', (req, res) => {
    res.json({ success: true, contacts: OFFICIAL_EMERGENCY_CONTACTS });
  });

  // Analytics Endpoint (for Authority & Admin Dashboards)
  app.get('/api/analytics', (req, res) => {
    const total = reportsStore.length;
    const pending = reportsStore.filter(r => r.status === 'pending' || r.status === 'under_review').length;
    const verified = reportsStore.filter(r => r.status === 'verified').length;
    const resolved = reportsStore.filter(r => r.status === 'resolved').length;
    const drains = reportsStore.filter(r => r.type === 'blocked_drain').length;

    res.json({
      success: true,
      analytics: {
        ...INITIAL_SYSTEM_ANALYTICS,
        totalReports: total,
        pendingVerification: pending,
        verifiedCount: verified,
        resolvedCount: resolved,
        blockedDrainsCount: drains
      }
    });
  });

  // Vite middleware for development vs production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FloodGuard Ghana Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
