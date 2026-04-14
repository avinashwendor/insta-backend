const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { COLLABORATION_STATUS } = require('../config/constants');
const {
  collaborationRepository,
} = require('../repositories/monetization.repository');
const { postRepository } = require('../repositories/post.repository');
const { reelRepository } = require('../repositories/reel.repository');

const getContentRepo = (type) => {
  if (type === 'post') return postRepository;
  if (type === 'reel') return reelRepository;
  throw ApiError.badRequest('Invalid content type');
};

const createCollaboration = async (inviterId, data) => {
  const contentRepo = getContentRepo(data.content_type);
  const content = await contentRepo.findById(data.content_id);
  if (!content) throw ApiError.notFound('Content not found');
  if (content.user_id.toString() !== inviterId) {
    throw ApiError.forbidden('Only the content owner can invite collaborators');
  }
  if (inviterId === data.invitee_id) throw ApiError.badRequest('Cannot collaborate with yourself');

  const existing = await collaborationRepository.findOne({
    content_id: data.content_id, invitee_id: data.invitee_id, status: COLLABORATION_STATUS.PENDING,
  });
  if (existing) throw ApiError.conflict('Collaboration invite already pending');

  const collab = await collaborationRepository.create({
    content_type: data.content_type,
    content_id: data.content_id,
    inviter_id: inviterId,
    invitee_id: data.invitee_id,
    message: data.message,
    watchtime_split: data.watchtime_split || { inviter_percent: 50, invitee_percent: 50 },
    revenue_split: data.revenue_split || { inviter_percent: 50, invitee_percent: 50 },
  });

  logger.info(`Collaboration invite created: ${collab._id}`);
  return collab;
};

const respondToCollaboration = async (collabId, userId, action) => {
  const collab = await collaborationRepository.findById(collabId);
  if (!collab) throw ApiError.notFound('Collaboration not found');
  if (collab.invitee_id.toString() !== userId) {
    throw ApiError.forbidden('Only the invitee can respond');
  }
  if (collab.status !== COLLABORATION_STATUS.PENDING) {
    throw ApiError.conflict(`Collaboration already ${collab.status}`);
  }

  const newStatus = action === 'accept'
    ? COLLABORATION_STATUS.ACCEPTED
    : COLLABORATION_STATUS.REJECTED;

  const updated = await collaborationRepository.updateById(collabId, {
    status: newStatus,
    responded_at: new Date(),
  });

  if (action === 'accept') {
    const contentRepo = getContentRepo(collab.content_type);
    await contentRepo.model.findByIdAndUpdate(collab.content_id, {
      $push: {
        collaborators: {
          user_id: userId,
          status: COLLABORATION_STATUS.ACCEPTED,
          watchtime_split: collab.watchtime_split.invitee_percent,
          revenue_split: collab.revenue_split.invitee_percent,
          accepted_at: new Date(),
        },
      },
    });
  }

  logger.info(`Collaboration ${collabId} ${action}ed`);
  return updated;
};

const getMyCollaborations = async (userId, { cursor, limit }) => {
  return collaborationRepository.getUserCollaborations(userId, null, { cursor, limit });
};

const getPendingInvites = async (userId, { cursor, limit }) => {
  return collaborationRepository.getPendingForUser(userId, { cursor, limit });
};

module.exports = { createCollaboration, respondToCollaboration, getMyCollaborations, getPendingInvites };
