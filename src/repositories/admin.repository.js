const BaseRepository = require('./base.repository');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

class ReportRepository extends BaseRepository {
  constructor() { super(Report); }

  async getPending(options = {}) {
    return this.findMany(
      { status: { $in: ['pending', 'reviewing'] } },
      { ...options, sort: { created_at: 1 }, populate: [
        { path: 'reporter_id', select: 'username display_name avatar_url' },
      ] }
    );
  }

  async getByTarget(targetType, targetId) {
    return this.findMany(
      { target_type: targetType, target_id: targetId },
      { sort: { created_at: -1 } }
    );
  }
}

class AuditLogRepository extends BaseRepository {
  constructor() { super(AuditLog); }

  async getRecentLogs(options = {}) {
    return this.findMany({}, {
      ...options,
      sort: { created_at: -1 },
      populate: [{ path: 'admin_id', select: 'username display_name' }],
    });
  }
}

module.exports = {
  reportRepository: new ReportRepository(),
  auditLogRepository: new AuditLogRepository(),
};
