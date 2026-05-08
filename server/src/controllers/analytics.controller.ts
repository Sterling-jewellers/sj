import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import BehaviorLog from '../models/BehaviorLog.model';

// POST /api/analytics/behavior
// Records anonymised customer behavior from the browser
export const logBehavior = asyncHandler(async (req: Request, res: Response) => {
  const {
    sessionId, visitCount, events,
    preferredStyles, preferredMetals,
    priceRangeMin, priceRangeMax,
    topShapes, topCategories,
  } = req.body;

  if (!sessionId) { res.status(400).json({ message: 'sessionId required' }); return; }

  await BehaviorLog.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        visitCount,
        preferredStyles,
        preferredMetals,
        priceRangeMin,
        priceRangeMax,
        topShapes,
        topCategories,
        ip:        req.ip,
        userAgent: req.headers['user-agent'],
      },
      $push: {
        events: {
          $each:     (events ?? []).slice(-50), // only store latest 50 events per sync
          $slice:    -200,                       // keep max 200 events per session
        },
      },
    },
    { upsert: true, new: true }
  );

  res.json({ ok: true });
});

// GET /api/analytics/behavior  (admin only)
// Returns aggregated behavior analytics
export const getBehaviorAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const [totalSessions, topStyles, topMetals, topSearches, recentSessions] = await Promise.all([
    BehaviorLog.countDocuments(),

    // Top preferred styles across all sessions
    BehaviorLog.aggregate([
      { $project: { styles: { $objectToArray: '$preferredStyles' } } },
      { $unwind: '$styles' },
      { $group: { _id: '$styles.k', total: { $sum: '$styles.v' } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),

    // Top preferred metals
    BehaviorLog.aggregate([
      { $project: { metals: { $objectToArray: '$preferredMetals' } } },
      { $unwind: '$metals' },
      { $group: { _id: '$metals.k', total: { $sum: '$metals.v' } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),

    // Top search queries
    BehaviorLog.aggregate([
      { $unwind: '$events' },
      { $match: { 'events.type': 'search', 'events.query': { $ne: null } } },
      { $group: { _id: '$events.query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),

    // Recent sessions (last 50)
    BehaviorLog.find()
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('sessionId visitCount preferredStyles preferredMetals priceRangeMin priceRangeMax topCategories updatedAt'),
  ]);

  res.json({
    totalSessions,
    topStyles:    topStyles.map(s => ({ style: s._id, score: s.total })),
    topMetals:    topMetals.map(m => ({ metal: m._id, score: m.total })),
    topSearches:  topSearches.map(s => ({ query: s._id, count: s.count })),
    recentSessions,
  });
});

// GET /api/analytics/export-ads  (admin only)
// Returns data formatted for Meta/Google Ads custom audiences
export const exportAdsData = asyncHandler(async (_req: Request, res: Response) => {
  const sessions = await BehaviorLog.find({ visitCount: { $gte: 2 } })
    .select('preferredStyles preferredMetals priceRangeMin priceRangeMax topCategories topShapes')
    .limit(1000);

  const interests = new Set<string>();
  const metals    = new Set<string>();

  sessions.forEach(s => {
    Object.keys(s.preferredStyles ?? {}).forEach(st => interests.add(st));
    Object.keys(s.preferredMetals ?? {}).forEach(m  => metals.add(m));
  });

  res.json({
    totalReturningUsers: sessions.length,
    commonInterests:     Array.from(interests),
    commonMetals:        Array.from(metals),
    // Note: These are aggregated, not individual-level data.
    // Use these to build Meta Custom Audiences or Google Ads audiences.
    sessions: sessions.map(s => ({
      preferredStyles: s.preferredStyles,
      preferredMetals: s.preferredMetals,
      priceRange: [s.priceRangeMin, s.priceRangeMax],
      topCategories: s.topCategories,
    })),
  });
});
