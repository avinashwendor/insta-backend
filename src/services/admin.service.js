const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { reportRepository, auditLogRepository } = require('../repositories/admin.repository');
const { userRepository } = require('../repositories/user.repository');
const { postRepository } = require('../repositories/post.repository');
const { reelRepository } = require('../repositories/reel.repository');
const { adCampaignRepository } = require('../repositories/monetization.repository');

/**
 * Record an admin action in the audit log.
 */
const logAdminAction = async (adminId, action, targetType, targetId, details, ip) => {
  await auditLogRepository.create({
    admin_id: adminId, action, target_type: targetType, target_id: targetId, details, ip_address: ip,
  });
};

// ─── Reports ─────────────────────────────────────────────────

const submitReport = async (userId, data) => {
  return reportRepository.create({ reporter_id: userId, ...data });
};

const getReports = async ({ cursor, limit }) => {
  return reportRepository.getPending({ cursor, limit });
};

const resolveReport = async (reportId, adminId, data) => {
  const report = await reportRepository.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found');

  // Apply content action
  if (data.content_action === 'remove' || data.content_action === 'hide') {
    const contentRepo = report.target_type === 'post' ? postRepository
      : report.target_type === 'reel' ? reelRepository : null;
    if (contentRepo) {
      const updateField = data.content_action === 'remove' ? 'is_hidden' : 'is_hidden';
      await contentRepo.updateById(report.target_id, {
        [updateField]: true,
        is_flagged: true,
        flag_reason: data.resolution,
      });
    }
  }

  // Apply user action
  if (data.user_action && data.user_action !== 'none' && report.target_type === 'user') {
    await applyUserAction(report.target_id, data.user_action, data.ban_duration_days);
  }

  const status = data.action === 'resolve' ? 'resolved' : 'dismissed';
  const updated = await reportRepository.updateById(reportId, {
    status,
    reviewed_by: adminId,
    resolution: data.resolution,
    resolved_at: new Date(),
  });

  await logAdminAction(adminId, `report_${status}`, 'report', reportId, data);
  logger.info(`Report ${reportId} ${status} by admin ${adminId}`);
  return updated;
};

// ─── User Moderation ─────────────────────────────────────────

const applyUserAction = async (userId, action, banDays) => {
  const updates = {};
  if (action === 'ban_perm') {
    updates.is_banned = true;
    updates.ban_reason = 'Permanently banned by admin';
  } else if (action === 'ban_temp') {
    updates.is_banned = true;
    updates.ban_reason = `Temporarily banned for ${banDays} days`;
    updates.ban_expires_at = new Date(Date.now() + banDays * 24 * 60 * 60 * 1000);
  }
  return userRepository.updateById(userId, updates);
};

const banUser = async (userId, adminId, { reason, duration_days }) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const updates = {
    is_banned: true,
    ban_reason: reason,
  };
  if (duration_days) {
    updates.ban_expires_at = new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000);
  }

  await userRepository.updateById(userId, updates);
  await logAdminAction(adminId, 'ban_user', 'user', userId, { reason, duration_days });
  logger.info(`User ${userId} banned by admin ${adminId}`);
};

const unbanUser = async (userId, adminId) => {
  await userRepository.updateById(userId, {
    is_banned: false,
    ban_reason: null,
    ban_expires_at: null,
  });
  await logAdminAction(adminId, 'unban_user', 'user', userId);
  logger.info(`User ${userId} unbanned by admin ${adminId}`);
};

// ─── Ad Campaign Review ──────────────────────────────────────

const reviewCampaign = async (campaignId, adminId, { action, rejection_reason }) => {
  const campaign = await adCampaignRepository.findById(campaignId);
  if (!campaign) throw ApiError.notFound('Campaign not found');
  if (campaign.status !== 'pending_review') {
    throw ApiError.conflict('Campaign is not pending review');
  }

  const status = action === 'approve' ? 'active' : 'rejected';
  const updates = { status };
  if (action === 'reject') updates.rejection_reason = rejection_reason;

  const updated = await adCampaignRepository.updateById(campaignId, updates);
  await logAdminAction(adminId, `campaign_${action}`, 'ad_campaign', campaignId, { rejection_reason });
  return updated;
};

// ─── Dashboard ───────────────────────────────────────────────

const getDashboardStats = async () => {
  const [totalUsers, activeUsers, totalPosts, totalReels, pendingReports] = await Promise.all([
    userRepository.countDocuments(),
    userRepository.countDocuments({ is_active: true }),
    postRepository.countDocuments(),
    reelRepository.countDocuments(),
    reportRepository.countDocuments({ status: 'pending' }),
  ]);

  return { total_users: totalUsers, active_users: activeUsers, total_posts: totalPosts, total_reels: totalReels, pending_reports: pendingReports };
};

const getAuditLogs = async ({ cursor, limit }) => {
  return auditLogRepository.getRecentLogs({ cursor, limit });
};

module.exports = {
  submitReport, getReports, resolveReport,
  banUser, unbanUser,
  reviewCampaign,
  getDashboardStats, getAuditLogs,
};
