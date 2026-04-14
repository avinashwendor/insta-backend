const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const {
  serverRepository,
  serverChannelRepository,
  serverMemberRepository,
} = require('../repositories/server.repository');
const { messageRepository } = require('../repositories/chat.repository');

const generateInviteCode = () => crypto.randomBytes(4).toString('hex');

const createServer = async (userId, serverData) => {
  const inviteCode = generateInviteCode();

  const server = await serverRepository.create({
    ...serverData,
    owner_id: userId,
    invite_code: inviteCode,
  });

  // Add owner as first member
  await serverMemberRepository.create({
    server_id: server._id,
    user_id: userId,
    role: 'owner',
  });

  // Create default "general" channel
  await serverChannelRepository.create({
    server_id: server._id,
    name: 'general',
    type: 'text',
    position: 0,
  });

  logger.info(`Server created: ${server.name} (${server._id}) by user ${userId}`);
  return server;
};

const getServer = async (serverId) => {
  const server = await serverRepository.findById(serverId);
  if (!server) throw ApiError.notFound('Server not found');
  return server;
};

const updateServer = async (serverId, userId, updateData) => {
  const membership = await serverMemberRepository.findMembership(serverId, userId);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw ApiError.forbidden('Only owner or admin can update the server');
  }
  return serverRepository.updateById(serverId, updateData);
};

const deleteServer = async (serverId, userId) => {
  const server = await serverRepository.findById(serverId);
  if (!server) throw ApiError.notFound('Server not found');
  if (server.owner_id.toString() !== userId) {
    throw ApiError.forbidden('Only the owner can delete the server');
  }

  await Promise.all([
    serverRepository.deleteById(serverId),
    serverChannelRepository.deleteMany({ server_id: serverId }),
    serverMemberRepository.deleteMany({ server_id: serverId }),
  ]);

  logger.info(`Server deleted: ${serverId}`);
};

const joinServer = async (serverId, userId) => {
  const server = await serverRepository.findById(serverId);
  if (!server) throw ApiError.notFound('Server not found');

  const existing = await serverMemberRepository.findMembership(serverId, userId);
  if (existing) throw ApiError.conflict('Already a member');

  await serverMemberRepository.create({
    server_id: serverId,
    user_id: userId,
    role: 'member',
  });

  await serverRepository.incrementById(serverId, { member_count: 1 });
  return { message: 'Joined server successfully' };
};

const joinByInviteCode = async (inviteCode, userId) => {
  const server = await serverRepository.findByInviteCode(inviteCode);
  if (!server) throw ApiError.notFound('Invalid invite code');
  return joinServer(server._id.toString(), userId);
};

const leaveServer = async (serverId, userId) => {
  const server = await serverRepository.findById(serverId);
  if (!server) throw ApiError.notFound('Server not found');
  if (server.owner_id.toString() === userId) {
    throw ApiError.badRequest('Owner cannot leave the server. Transfer ownership or delete it.');
  }

  const removed = await serverMemberRepository.removeMember(serverId, userId);
  if (!removed) throw ApiError.notFound('Not a member');
  await serverRepository.incrementById(serverId, { member_count: -1 });
};

const getMembers = async (serverId, { cursor, limit }) => {
  return serverMemberRepository.getServerMembers(serverId, { cursor, limit });
};

const updateMemberRole = async (serverId, targetUserId, role, currentUserId) => {
  const membership = await serverMemberRepository.findMembership(serverId, currentUserId);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw ApiError.forbidden('Only owner or admin can change roles');
  }

  const target = await serverMemberRepository.findMembership(serverId, targetUserId);
  if (!target) throw ApiError.notFound('User is not a member');
  if (target.role === 'owner') throw ApiError.forbidden('Cannot change owner role');

  return serverMemberRepository.updateOne(
    { server_id: serverId, user_id: targetUserId },
    { role }
  );
};

const getMyServers = async (userId) => {
  return serverMemberRepository.getUserServers(userId);
};

const discoverServers = async ({ cursor, limit }) => {
  return serverRepository.getPublicServers({ cursor, limit });
};

// Channel operations
const createChannel = async (serverId, userId, channelData) => {
  const membership = await serverMemberRepository.findMembership(serverId, userId);
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw ApiError.forbidden('Only owner or admin can create channels');
  }

  return serverChannelRepository.create({
    server_id: serverId,
    ...channelData,
  });
};

const getChannels = async (serverId) => {
  return serverChannelRepository.getServerChannels(serverId);
};

const getChannelMessages = async (serverId, channelId, userId, { cursor, limit }) => {
  // Verify membership
  const membership = await serverMemberRepository.findMembership(serverId, userId);
  if (!membership) throw ApiError.forbidden('Not a server member');

  return messageRepository.getConversationMessages(channelId, { cursor, limit });
};

const sendChannelMessage = async (serverId, channelId, userId, text) => {
  const membership = await serverMemberRepository.findMembership(serverId, userId);
  if (!membership) throw ApiError.forbidden('Not a server member');

  return messageRepository.create({
    conversation_id: channelId,
    sender_id: userId,
    type: 'text',
    content: { text },
  });
};

module.exports = {
  createServer, getServer, updateServer, deleteServer,
  joinServer, joinByInviteCode, leaveServer,
  getMembers, updateMemberRole,
  getMyServers, discoverServers,
  createChannel, getChannels,
  getChannelMessages, sendChannelMessage,
};
