const BaseRepository = require('./base.repository');
const Collaboration = require('../models/Collaboration');
const CollaborationRevenue = require('../models/CollaborationRevenue');
const { AdCampaign, AdImpression, AdRevenue } = require('../models/Ad');
const { Membership, MembershipTransaction } = require('../models/Membership');
const { UserAnalytics, ContentAnalytics, WatchSession } = require('../models/Analytics');

class CollaborationRepository extends BaseRepository {
  constructor() { super(Collaboration); }

  async getPendingForUser(userId, options = {}) {
    return this.findMany(
      { invitee_id: userId, status: 'pending' },
      { ...options, sort: { created_at: -1 }, populate: [{ path: 'inviter_id', select: 'username display_name avatar_url' }] }
    );
  }

  async getUserCollaborations(userId, status, options = {}) {
    const filter = { $or: [{ inviter_id: userId }, { invitee_id: userId }] };
    if (status) filter.status = status;
    return this.findMany(filter, { ...options, sort: { created_at: -1 } });
  }
}

class CollaborationRevenueRepository extends BaseRepository {
  constructor() { super(CollaborationRevenue); }
}

class AdCampaignRepository extends BaseRepository {
  constructor() { super(AdCampaign); }

  async getUserCampaigns(userId, options = {}) {
    return this.findMany({ advertiser_id: userId }, { ...options, sort: { created_at: -1 } });
  }

  async getActiveCampaigns() {
    const now = new Date();
    return this.findMany({
      status: 'active',
      'schedule.start_date': { $lte: now },
      'schedule.end_date': { $gte: now },
    }, { sort: { 'budget.bid_amount': -1 } });
  }
}

class AdImpressionRepository extends BaseRepository {
  constructor() { super(AdImpression); }
}

class AdRevenueRepository extends BaseRepository {
  constructor() { super(AdRevenue); }

  async getCreatorEarnings(creatorId, options = {}) {
    return this.findMany({ creator_id: creatorId }, { ...options, sort: { created_at: -1 } });
  }
}

class MembershipRepository extends BaseRepository {
  constructor() { super(Membership); }

  async getActiveTiers() {
    return this.findMany({ is_active: true }, { sort: { tier_level: 1 } });
  }
}

class MembershipTransactionRepository extends BaseRepository {
  constructor() { super(MembershipTransaction); }

  async getUserTransactions(userId, options = {}) {
    return this.findMany({ user_id: userId }, { ...options, sort: { created_at: -1 } });
  }
}

class UserAnalyticsRepository extends BaseRepository {
  constructor() { super(UserAnalytics); }

  async getRange(userId, startDate, endDate) {
    return this.findMany(
      { user_id: userId, date: { $gte: startDate, $lte: endDate } },
      { sort: { date: 1 }, limit: 365 }
    );
  }

  async upsertDay(userId, date, increments) {
    return this.model.findOneAndUpdate(
      { user_id: userId, date },
      { $inc: increments, $setOnInsert: { user_id: userId, date } },
      { upsert: true, new: true }
    );
  }
}

class ContentAnalyticsRepository extends BaseRepository {
  constructor() { super(ContentAnalytics); }

  async getRange(contentType, contentId, startDate, endDate) {
    return this.findMany(
      { content_type: contentType, content_id: contentId, date: { $gte: startDate, $lte: endDate } },
      { sort: { date: 1 }, limit: 365 }
    );
  }
}

class WatchSessionRepository extends BaseRepository {
  constructor() { super(WatchSession); }
}

module.exports = {
  collaborationRepository: new CollaborationRepository(),
  collaborationRevenueRepository: new CollaborationRevenueRepository(),
  adCampaignRepository: new AdCampaignRepository(),
  adImpressionRepository: new AdImpressionRepository(),
  adRevenueRepository: new AdRevenueRepository(),
  membershipRepository: new MembershipRepository(),
  membershipTransactionRepository: new MembershipTransactionRepository(),
  userAnalyticsRepository: new UserAnalyticsRepository(),
  contentAnalyticsRepository: new ContentAnalyticsRepository(),
  watchSessionRepository: new WatchSessionRepository(),
};
