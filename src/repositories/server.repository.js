const BaseRepository = require('./base.repository');
const Server = require('../models/Server');
const ServerChannel = require('../models/ServerChannel');
const ServerMember = require('../models/ServerMember');

class ServerRepository extends BaseRepository {
  constructor() { super(Server); }

  async getPublicServers(options = {}) {
    return this.findMany(
      { is_public: true },
      { ...options, sort: { member_count: -1 } }
    );
  }

  async findByInviteCode(code) {
    return this.findOne({ invite_code: code });
  }
}

class ServerChannelRepository extends BaseRepository {
  constructor() { super(ServerChannel); }

  async getServerChannels(serverId) {
    return this.findMany(
      { server_id: serverId, is_archived: false },
      { sort: { position: 1 }, limit: 500 }
    );
  }
}

class ServerMemberRepository extends BaseRepository {
  constructor() { super(ServerMember); }

  async findMembership(serverId, userId) {
    return this.findOne({ server_id: serverId, user_id: userId });
  }

  async getServerMembers(serverId, options = {}) {
    return this.findMany(
      { server_id: serverId },
      {
        ...options,
        sort: { joined_at: 1 },
        populate: [
          { path: 'user_id', select: 'username display_name avatar_url is_verified' },
        ],
      }
    );
  }

  async getUserServers(userId) {
    return this.findMany(
      { user_id: userId },
      {
        sort: { joined_at: -1 },
        populate: [{ path: 'server_id' }],
        limit: 500,
      }
    );
  }

  async removeMember(serverId, userId) {
    return this.model.findOneAndDelete({ server_id: serverId, user_id: userId });
  }
}

module.exports = {
  serverRepository: new ServerRepository(),
  serverChannelRepository: new ServerChannelRepository(),
  serverMemberRepository: new ServerMemberRepository(),
};
