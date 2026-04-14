const ApiError = require('../utils/ApiError');
const {
  membershipRepository,
  membershipTransactionRepository,
} = require('../repositories/monetization.repository');
const { userRepository } = require('../repositories/user.repository');

const getTiers = async () => {
  return membershipRepository.getActiveTiers();
};

const subscribe = async (userId, membershipId, { payment_gateway, billing_period }) => {
  const tier = await membershipRepository.findById(membershipId);
  if (!tier || !tier.is_active) throw ApiError.notFound('Membership tier not found');

  const amount = billing_period === 'yearly' ? tier.price_yearly : tier.price_monthly;
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (billing_period === 'yearly' ? 12 : 1));

  const transaction = await membershipTransactionRepository.create({
    user_id: userId,
    membership_id: membershipId,
    type: 'subscribe',
    amount,
    payment_gateway,
    status: 'completed',
    period_start: periodStart,
    period_end: periodEnd,
  });

  await userRepository.updateById(userId, {
    membership_tier: tier.name.toLowerCase(),
    membership_expires_at: periodEnd,
  });

  return transaction;
};

const getMySubscription = async (userId) => {
  const user = await userRepository.findById(userId, 'membership_tier membership_expires_at');
  return {
    tier: user.membership_tier,
    expires_at: user.membership_expires_at,
    is_active: user.membership_expires_at && user.membership_expires_at > new Date(),
  };
};

const getTransactionHistory = async (userId, { cursor, limit }) => {
  return membershipTransactionRepository.getUserTransactions(userId, { cursor, limit });
};

module.exports = { getTiers, subscribe, getMySubscription, getTransactionHistory };
