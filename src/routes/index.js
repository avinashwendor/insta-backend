const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const storyRoutes = require('./story.routes');
const reelRoutes = require('./reel.routes');
const commentRoutes = require('./comment.routes');
const chatRoutes = require('./chat.routes');
const notificationRoutes = require('./notification.routes');
const serverRoutes = require('./server.routes');
const collaborationRoutes = require('./collaboration.routes');
const adRoutes = require('./ad.routes');
const membershipRoutes = require('./membership.routes');
const analyticsRoutes = require('./analytics.routes');
const audioRoutes = require('./audio.routes');
const savedRoutes = require('./saved.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

/**
 * API v1 route aggregator.
 * All routes are mounted under /api/v1 in app.js.
 */

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Phase 1: Auth & Users
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Phase 2: Content
router.use('/posts', postRoutes);
router.use('/stories', storyRoutes);
router.use('/reels', reelRoutes);
router.use('/comments', commentRoutes);

// Phase 3: Social & Messaging
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/servers', serverRoutes);

// Phase 4: Monetization & Analytics
router.use('/collaborations', collaborationRoutes);
router.use('/ads', adRoutes);
router.use('/memberships', membershipRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audio', audioRoutes);
router.use('/saved', savedRoutes);

// Phase 5: Admin
router.use('/admin', adminRoutes);

module.exports = router;

