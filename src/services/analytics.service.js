const {
  userAnalyticsRepository,
  contentAnalyticsRepository,
  watchSessionRepository,
} = require('../repositories/monetization.repository');

const getUserAnalytics = async (userId, startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  return userAnalyticsRepository.getRange(userId, start, end);
};

const getContentAnalytics = async (contentType, contentId, startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  return contentAnalyticsRepository.getRange(contentType, contentId, start, end);
};

const recordWatchSession = async (userId, sessionData) => {
  const session = await watchSessionRepository.create({
    user_id: userId,
    ...sessionData,
  });

  // Update content analytics for the day
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await contentAnalyticsRepository.model.findOneAndUpdate(
    { content_type: sessionData.content_type, content_id: sessionData.content_id, date: today },
    {
      $inc: { views: 1 },
      $setOnInsert: {
        content_type: sessionData.content_type,
        content_id: sessionData.content_id,
        date: today,
      },
    },
    { upsert: true }
  );

  return session;
};

const incrementUserAnalytics = async (userId, field, amount = 1) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return userAnalyticsRepository.upsertDay(userId, today, { [field]: amount });
};

module.exports = { getUserAnalytics, getContentAnalytics, recordWatchSession, incrementUserAnalytics };
