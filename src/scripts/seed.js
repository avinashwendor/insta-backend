/**
 * Database seed script.
 * Creates initial admin user, membership tiers, and sample hashtags.
 *
 * Usage: node src/scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const connectDatabase = require('../config/database');
const User = require('../models/User');
const UserSetting = require('../models/UserSetting');
const { Membership } = require('../models/Membership');
const Hashtag = require('../models/Hashtag');
const logger = require('../utils/logger');

const seedAdmin = async () => {
  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    logger.info('Admin user already exists, skipping...');
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@1234', config.bcrypt.saltRounds);

  const admin = await User.create({
    username: 'admin',
    email: 'admin@instayt.com',
    display_name: 'INSTAYT Admin',
    password_hash: passwordHash,
    account_type: 'admin',
    is_verified: true,
    date_of_birth: new Date('1990-01-01'),
  });

  await UserSetting.create({ user_id: admin._id });

  logger.info(`Admin user created: admin@instayt.com / Admin@1234`);
};

const seedMembershipTiers = async () => {
  const count = await Membership.countDocuments();
  if (count > 0) {
    logger.info('Membership tiers already exist, skipping...');
    return;
  }

  const tiers = [
    {
      name: 'Free',
      tier_level: 0,
      price_monthly: 0,
      price_yearly: 0,
      features: [
        { name: 'Basic posting', description: 'Up to 10 posts per day' },
        { name: 'Stories', description: 'Share stories with followers' },
        { name: 'DM', description: 'Direct messaging' },
      ],
    },
    {
      name: 'Silver',
      tier_level: 1,
      price_monthly: 4.99,
      price_yearly: 49.99,
      badge_url: '/badges/silver.png',
      features: [
        { name: 'Everything in Free', description: 'All free features included' },
        { name: 'Analytics', description: 'Basic profile analytics' },
        { name: 'Priority support', description: 'Faster response times' },
        { name: 'Custom fonts', description: 'Custom chat fonts' },
      ],
    },
    {
      name: 'Gold',
      tier_level: 2,
      price_monthly: 9.99,
      price_yearly: 99.99,
      badge_url: '/badges/gold.png',
      features: [
        { name: 'Everything in Silver', description: 'All Silver features' },
        { name: 'Advanced Analytics', description: 'Detailed content & audience analytics' },
        { name: 'Monetization', description: 'Earn from ad revenue and collaborations' },
        { name: 'Longer videos', description: 'Up to 90s reels' },
      ],
    },
    {
      name: 'Platinum',
      tier_level: 3,
      price_monthly: 19.99,
      price_yearly: 199.99,
      badge_url: '/badges/platinum.png',
      features: [
        { name: 'Everything in Gold', description: 'All Gold features' },
        { name: 'Verified badge', description: 'Platform verification badge' },
        { name: 'API access', description: 'Content management API access' },
        { name: 'Dedicated support', description: 'Priority 1:1 support' },
        { name: 'Ad campaigns', description: 'Create and manage ad campaigns' },
      ],
    },
  ];

  await Membership.insertMany(tiers);
  logger.info(`${tiers.length} membership tiers created`);
};

const seedHashtags = async () => {
  const count = await Hashtag.countDocuments();
  if (count > 0) {
    logger.info('Hashtags already exist, skipping...');
    return;
  }

  const hashtags = [
    'photography', 'art', 'music', 'travel', 'food', 'fashion', 'fitness',
    'nature', 'gaming', 'tech', 'beauty', 'sports', 'comedy', 'education',
    'science', 'motivation', 'dance', 'diy', 'cooking', 'business',
  ].map((name) => ({ name, is_trending: true }));

  await Hashtag.insertMany(hashtags);
  logger.info(`${hashtags.length} trending hashtags seeded`);
};

const run = async () => {
  try {
    await connectDatabase();
    logger.info('Starting database seed...');

    await seedAdmin();
    await seedMembershipTiers();
    await seedHashtags();

    logger.info('Database seed completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  }
};

run();
