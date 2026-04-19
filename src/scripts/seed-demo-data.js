/**
 * Demo dataset seeder.
 *
 * Creates a realistic social graph for end-to-end testing of the mobile app:
 *   - 6 test accounts (personal, creator, business) with a known shared password
 *   - Follow relationships (directed graph, not symmetric)
 *   - Feed posts with media, captions, hashtags, likes, comments, saves
 *   - Reels with videos, likes, comments
 *   - Stories (expire in 24h)
 *   - Ad campaigns (multiple statuses)
 *   - Collaboration invitations (pending + accepted)
 *   - 30 days of UserAnalytics rows per creator
 *   - AdRevenue history for the monetization screens
 *
 * Idempotent: rerunning wipes only the content owned by demo users, then
 * regenerates. The admin account and membership tiers from `seed.js` are
 * untouched.
 *
 * Usage:
 *   node src/scripts/seed-demo-data.js
 *   node src/scripts/seed-demo-data.js --reset   # wipe demo users too
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const config = require('../config');
const connectDatabase = require('../config/database');
const logger = require('../utils/logger');

const User = require('../models/User');
const UserSetting = require('../models/UserSetting');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Story = require('../models/Story');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Save = require('../models/Save');
const Follower = require('../models/Follower');
const Notification = require('../models/Notification');
const Collaboration = require('../models/Collaboration');
const { AdCampaign, AdRevenue } = require('../models/Ad');
const { UserAnalytics } = require('../models/Analytics');

/* ────────────────────────── account fixtures ────────────────────────── */

const DEMO_PASSWORD = 'Demo@1234';

const DEMO_USERS = [
  {
    username: 'demouser',
    email: 'user@instayt.com',
    display_name: 'Demo User',
    bio: 'Seeded personal account for development and QA.',
    account_type: 'personal',
    is_verified: false,
    avatar_seed: 'demouser',
    interests: ['photography', 'music'],
    password: 'User@1234', // keep backward-compatible with seed.js
  },
  {
    username: 'alice_creator',
    email: 'alice@instayt.com',
    display_name: 'Alice Morgan',
    bio: 'Travel creator · Storytelling through film · 📍 Lisbon',
    account_type: 'creator',
    is_verified: true,
    avatar_seed: 'alice',
    interests: ['travel', 'photography'],
    password: DEMO_PASSWORD,
  },
  {
    username: 'bob_photographer',
    email: 'bob@instayt.com',
    display_name: 'Bob Chen',
    bio: 'Light hunter · Commercial & editorial photography',
    account_type: 'creator',
    is_verified: false,
    avatar_seed: 'bob',
    interests: ['photography', 'art'],
    password: DEMO_PASSWORD,
  },
  {
    username: 'carol_fitness',
    email: 'carol@instayt.com',
    display_name: 'Carol Ramirez',
    bio: 'Coach · Strength & mobility · Online programs link below',
    account_type: 'creator',
    is_verified: true,
    avatar_seed: 'carol',
    interests: ['fitness', 'motivation'],
    password: DEMO_PASSWORD,
  },
  {
    username: 'dan_chef',
    email: 'dan@instayt.com',
    display_name: 'Dan Patel',
    bio: 'Chef · Home kitchen experiments · Recipes in bio',
    account_type: 'creator',
    is_verified: false,
    avatar_seed: 'dan',
    interests: ['food', 'cooking'],
    password: DEMO_PASSWORD,
  },
  {
    username: 'eve_business',
    email: 'eve@instayt.com',
    display_name: 'Eve Studios',
    bio: 'Creative agency · Campaigns, collabs, content production',
    account_type: 'business',
    is_verified: true,
    avatar_seed: 'eve',
    interests: ['business', 'art'],
    password: DEMO_PASSWORD,
  },
];

const DEMO_USERNAMES = DEMO_USERS.map((u) => u.username);

/* ────────────────────────── media fixtures ────────────────────────── */

const IMAGE_SEEDS = [
  'aurora', 'harbor', 'desert', 'canyon', 'street', 'gallery',
  'market', 'sunset', 'forest', 'espresso', 'marathon', 'coastline',
  'riverbed', 'cyclist', 'atelier', 'bakery',
];

/** Build a deterministic image URL. Picsum returns a real 1080x1080 JPEG. */
const pickImage = (seed, w = 1080, h = 1080) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

// A small set of public, CORS-friendly sample videos. These are well-known
// Google-hosted sample MP4s that the native video player can stream.
const SAMPLE_VIDEOS = [
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: pickImage('bunny', 720, 1280),
    duration: 60,
    width: 720,
    height: 1280,
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: pickImage('elephants', 720, 1280),
    duration: 45,
    width: 720,
    height: 1280,
  },
  {
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: pickImage('blaze', 720, 1280),
    duration: 20,
    width: 720,
    height: 1280,
  },
];

/* ────────────────────────── helpers ────────────────────────── */

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickOne = (arr) => arr[randInt(0, arr.length - 1)];
const pickMany = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  }
  return out;
};

const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const hoursAgo = (hours) => {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
};

/* ────────────────────────── reset step ────────────────────────── */

/**
 * Remove all content owned by demo users. Keeps the admin account and any
 * real user data intact. The demo user documents themselves are kept unless
 * `--reset` was passed, so their `_id`s stay stable across re-seeds.
 */
const wipeDemoContent = async (demoUserIds, { dropUsers = false } = {}) => {
  const ids = demoUserIds.map((id) => new mongoose.Types.ObjectId(id));
  const idFilter = { $in: ids };

  // Collect post/reel IDs before deletion so dependent docs are cleaned up too.
  const postIds = (await Post.find({ user_id: idFilter }, '_id').lean()).map((p) => p._id);
  const reelIds = (await Reel.find({ user_id: idFilter }, '_id').lean()).map((r) => r._id);

  const contentIds = [...postIds, ...reelIds];

  await Promise.all([
    Post.deleteMany({ user_id: idFilter }),
    Reel.deleteMany({ user_id: idFilter }),
    Story.deleteMany({ user_id: idFilter }),
    Comment.deleteMany({
      $or: [
        { user_id: idFilter },
        { content_id: { $in: contentIds } },
      ],
    }),
    Like.deleteMany({
      $or: [
        { user_id: idFilter },
        { target_id: { $in: contentIds } },
      ],
    }),
    Save.deleteMany({ user_id: idFilter }),
    Follower.deleteMany({
      $or: [{ follower_id: idFilter }, { following_id: idFilter }],
    }),
    Notification.deleteMany({
      $or: [{ user_id: idFilter }, { sender_id: idFilter }],
    }),
    Collaboration.deleteMany({
      $or: [{ inviter_id: idFilter }, { invitee_id: idFilter }],
    }),
    AdCampaign.deleteMany({ advertiser_id: idFilter }),
    AdRevenue.deleteMany({ creator_id: idFilter }),
    UserAnalytics.deleteMany({ user_id: idFilter }),
  ]);

  if (dropUsers) {
    await Promise.all([
      UserSetting.deleteMany({ user_id: idFilter }),
      User.deleteMany({ _id: idFilter }),
    ]);
  }
};

/* ────────────────────────── seeders ────────────────────────── */

const seedUsers = async () => {
  const created = {};
  for (const spec of DEMO_USERS) {
    let user = await User.findOne({ username: spec.username });
    if (!user) {
      const passwordHash = await bcrypt.hash(spec.password, config.bcrypt.saltRounds);
      user = await User.create({
        username: spec.username,
        email: spec.email,
        display_name: spec.display_name,
        password_hash: passwordHash,
        account_type: spec.account_type,
        is_verified: spec.is_verified,
        bio: spec.bio,
        avatar_url: pickImage(`avatar-${spec.avatar_seed}`, 512, 512),
        cover_url: pickImage(`cover-${spec.avatar_seed}`, 1200, 400),
        date_of_birth: new Date('1995-01-01'),
        interests: spec.interests,
      });
      await UserSetting.create({ user_id: user._id });
      logger.info(`Created demo user: ${spec.username} / ${spec.password}`);
    } else {
      // Make sure existing users have realistic avatar/cover so the screens
      // aren't empty when re-seeding without --reset.
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            display_name: spec.display_name,
            bio: spec.bio,
            avatar_url: user.avatar_url || pickImage(`avatar-${spec.avatar_seed}`, 512, 512),
            cover_url: user.cover_url || pickImage(`cover-${spec.avatar_seed}`, 1200, 400),
            account_type: spec.account_type,
            is_verified: spec.is_verified,
            interests: spec.interests,
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            reels_count: 0,
          },
        },
      );
    }
    created[spec.username] = user;
  }
  return created;
};

const seedFollows = async (users) => {
  // Build an asymmetric follow graph so testing covers both sides of the
  // follower/following relationship.
  const graph = [
    ['demouser', 'alice_creator'],
    ['demouser', 'carol_fitness'],
    ['demouser', 'dan_chef'],
    ['alice_creator', 'bob_photographer'],
    ['alice_creator', 'carol_fitness'],
    ['bob_photographer', 'alice_creator'],
    ['bob_photographer', 'eve_business'],
    ['carol_fitness', 'demouser'],
    ['carol_fitness', 'eve_business'],
    ['dan_chef', 'alice_creator'],
    ['dan_chef', 'demouser'],
    ['eve_business', 'alice_creator'],
    ['eve_business', 'carol_fitness'],
  ];

  for (const [followerName, followingName] of graph) {
    const follower = users[followerName];
    const following = users[followingName];
    await Follower.updateOne(
      { follower_id: follower._id, following_id: following._id },
      { $setOnInsert: { status: 'active' } },
      { upsert: true },
    );
  }

  // Recompute denormalized counts.
  for (const username of DEMO_USERNAMES) {
    const u = users[username];
    const [followers, following] = await Promise.all([
      Follower.countDocuments({ following_id: u._id, status: 'active' }),
      Follower.countDocuments({ follower_id: u._id, status: 'active' }),
    ]);
    await User.updateOne(
      { _id: u._id },
      { $set: { followers_count: followers, following_count: following } },
    );
  }
};

const POST_RECIPES = [
  {
    owner: 'alice_creator',
    caption: 'Soft morning in the old town. Nothing like chasing golden hour 🌅 #travel #photography',
    hashtags: ['travel', 'photography'],
    mediaSeeds: ['aurora'],
    location: { name: 'Lisbon, Portugal' },
    daysAgo: 1,
  },
  {
    owner: 'alice_creator',
    caption: 'Three weeks on the road, one suitcase, zero regrets. Swipe for my carry-on packing list ✈️',
    hashtags: ['travel'],
    mediaSeeds: ['harbor', 'coastline', 'market'],
    location: { name: 'Porto, Portugal' },
    daysAgo: 4,
  },
  {
    owner: 'bob_photographer',
    caption: 'Late-night neon on 7th — this whole block felt like a movie set tonight. #photography #street',
    hashtags: ['photography'],
    mediaSeeds: ['street'],
    location: { name: 'Brooklyn, NY' },
    daysAgo: 2,
  },
  {
    owner: 'bob_photographer',
    caption: 'Gallery print run done. Big thanks to everyone who came through the studio today 🙏',
    hashtags: ['art', 'photography'],
    mediaSeeds: ['gallery', 'atelier'],
    daysAgo: 6,
  },
  {
    owner: 'carol_fitness',
    caption: 'Friday leg day complete. Form over everything — I will die on this hill 💪 #fitness #motivation',
    hashtags: ['fitness', 'motivation'],
    mediaSeeds: ['marathon'],
    daysAgo: 0,
  },
  {
    owner: 'carol_fitness',
    caption: '8-week mobility plan dropped today. Comment "move" and I\'ll DM the program 🔥',
    hashtags: ['fitness'],
    mediaSeeds: ['cyclist'],
    daysAgo: 3,
  },
  {
    owner: 'dan_chef',
    caption: 'Sunday ragu, four hours, zero shortcuts. The house smells incredible.',
    hashtags: ['food', 'cooking'],
    mediaSeeds: ['bakery'],
    daysAgo: 1,
  },
  {
    owner: 'dan_chef',
    caption: 'Spent the afternoon testing a new sourdough ratio. Crumb is finally where I want it 🍞',
    hashtags: ['cooking'],
    mediaSeeds: ['bakery', 'espresso'],
    daysAgo: 5,
  },
  {
    owner: 'eve_business',
    caption: 'Behind the scenes from the Spring campaign shoot. More frames coming this week.',
    hashtags: ['business', 'art'],
    mediaSeeds: ['canyon', 'sunset'],
    daysAgo: 2,
  },
  {
    owner: 'demouser',
    caption: 'Testing the new create flow in the app — feeling pretty good about it 😄',
    hashtags: ['tech'],
    mediaSeeds: ['forest'],
    daysAgo: 0,
  },
];

const COMMENT_POOL = [
  'This is incredible 🔥',
  'Saved for inspiration!',
  'Tell me you have a preset for this??',
  'Beautiful shot.',
  'Where was this taken?',
  'Okay this is the one.',
  'Literally obsessed.',
  'Framed version when 🙏',
  'How long did this take?',
  'Everything about this 👏',
];

const seedPosts = async (users) => {
  const createdPosts = [];

  for (const recipe of POST_RECIPES) {
    const author = users[recipe.owner];
    const createdAt = daysAgo(recipe.daysAgo + Math.random());
    const mediaDocs = recipe.mediaSeeds.map((seed, i) => ({
      url: pickImage(seed),
      thumbnail_url: pickImage(seed, 400, 400),
      type: 'image',
      width: 1080,
      height: 1080,
      alt_text: '',
      order: i,
    }));

    const type = mediaDocs.length > 1 ? 'carousel' : 'image';

    const post = await Post.create({
      user_id: author._id,
      type,
      caption: recipe.caption,
      media: mediaDocs,
      hashtags: recipe.hashtags,
      location: recipe.location,
      visibility: 'public',
      comments_enabled: true,
      likes_visible: true,
      created_at: createdAt,
      updated_at: createdAt,
    });
    // Mongoose auto-manages timestamps; ensure ours stick by a follow-up set.
    await Post.updateOne({ _id: post._id }, { $set: { created_at: createdAt, updated_at: createdAt } });

    createdPosts.push({ post, authorId: author._id });
  }

  // Likes: between 3 and 6 random users per post (excluding author).
  const allUserIds = DEMO_USERNAMES.map((u) => users[u]._id.toString());
  for (const { post, authorId } of createdPosts) {
    const likers = pickMany(
      allUserIds.filter((id) => id !== authorId.toString()),
      randInt(3, Math.min(6, allUserIds.length - 1)),
    );
    for (const likerId of likers) {
      await Like.updateOne(
        { user_id: likerId, target_type: 'post', target_id: post._id },
        { $setOnInsert: { created_at: hoursAgo(randInt(1, 72)) } },
        { upsert: true },
      );
    }
    const likesCount = await Like.countDocuments({ target_type: 'post', target_id: post._id });

    // Comments: 2–5 per post.
    const commenterPool = allUserIds.filter((id) => id !== authorId.toString());
    const commentCount = randInt(2, 5);
    let commentsCreated = 0;
    for (let i = 0; i < commentCount; i++) {
      const commenterId = pickOne(commenterPool);
      await Comment.create({
        content_type: 'post',
        content_id: post._id,
        user_id: commenterId,
        text: pickOne(COMMENT_POOL),
        created_at: hoursAgo(randInt(1, 48)),
      });
      commentsCreated += 1;
    }

    // A handful of saves across users, counted in saves_count.
    const savers = pickMany(commenterPool, randInt(1, 3));
    for (const saverId of savers) {
      await Save.updateOne(
        { user_id: saverId, target_type: 'post', target_id: post._id },
        { $setOnInsert: { collection_name: 'All Posts' } },
        { upsert: true },
      );
    }
    const savesCount = await Save.countDocuments({ target_type: 'post', target_id: post._id });

    await Post.updateOne(
      { _id: post._id },
      {
        $set: {
          likes_count: likesCount,
          comments_count: commentsCreated,
          saves_count: savesCount,
          views_count: likesCount * randInt(8, 15),
        },
      },
    );
  }

  // Denormalize posts_count on users.
  for (const username of DEMO_USERNAMES) {
    const u = users[username];
    const count = await Post.countDocuments({ user_id: u._id });
    await User.updateOne({ _id: u._id }, { $set: { posts_count: count } });
  }
};

const REEL_RECIPES = [
  {
    owner: 'alice_creator',
    title: '48 hours in Porto',
    description: '48-hour itinerary from the airport to the river. Watch to the end for the best pastel de nata in the city 🇵🇹',
    hashtags: ['travel', 'photography'],
    daysAgo: 0,
  },
  {
    owner: 'carol_fitness',
    title: 'Mobility reset',
    description: '5-minute hip mobility reset I do before every lift. Save this 🔖',
    hashtags: ['fitness', 'motivation'],
    daysAgo: 1,
  },
  {
    owner: 'dan_chef',
    title: '30-second pasta dough',
    description: '30-second pasta dough, no machine required. Try it this weekend.',
    hashtags: ['food', 'cooking'],
    daysAgo: 2,
  },
  {
    owner: 'bob_photographer',
    title: 'Editing flow',
    description: 'Editing flow on the new print series. 3 passes, 2 masks, 1 grade.',
    hashtags: ['photography', 'art'],
    daysAgo: 3,
  },
];

const seedReels = async (users) => {
  const allUserIds = DEMO_USERNAMES.map((u) => users[u]._id.toString());
  const createdReels = [];

  for (const recipe of REEL_RECIPES) {
    const author = users[recipe.owner];
    const sample = pickOne(SAMPLE_VIDEOS);
    const createdAt = daysAgo(recipe.daysAgo + Math.random());

    const reel = await Reel.create({
      user_id: author._id,
      video_url: sample.url,
      thumbnail_url: sample.thumbnail,
      duration: sample.duration,
      width: sample.width,
      height: sample.height,
      title: recipe.title,
      description: recipe.description,
      hashtags: recipe.hashtags,
      audio: { title: 'Original audio', artist: author.display_name, is_original: true },
      allow_remix: true,
      allow_duet: true,
    });
    await Reel.updateOne({ _id: reel._id }, { $set: { created_at: createdAt, updated_at: createdAt } });

    const likers = pickMany(
      allUserIds.filter((id) => id !== author._id.toString()),
      randInt(3, Math.min(5, allUserIds.length - 1)),
    );
    for (const likerId of likers) {
      await Like.updateOne(
        { user_id: likerId, target_type: 'reel', target_id: reel._id },
        { $setOnInsert: { created_at: hoursAgo(randInt(1, 72)) } },
        { upsert: true },
      );
    }
    const likesCount = await Like.countDocuments({ target_type: 'reel', target_id: reel._id });

    const commenterPool = allUserIds.filter((id) => id !== author._id.toString());
    const commentCount = randInt(2, 4);
    for (let i = 0; i < commentCount; i++) {
      await Comment.create({
        content_type: 'reel',
        content_id: reel._id,
        user_id: pickOne(commenterPool),
        text: pickOne(COMMENT_POOL),
        created_at: hoursAgo(randInt(1, 48)),
      });
    }

    const viewsCount = likesCount * randInt(12, 30);
    await Reel.updateOne(
      { _id: reel._id },
      {
        $set: {
          likes_count: likesCount,
          comments_count: commentCount,
          views_count: viewsCount,
          avg_watch_time: Math.min(sample.duration, randInt(10, sample.duration)),
        },
      },
    );

    createdReels.push({ reel, authorId: author._id });
  }

  for (const username of DEMO_USERNAMES) {
    const u = users[username];
    const count = await Reel.countDocuments({ user_id: u._id });
    await User.updateOne({ _id: u._id }, { $set: { reels_count: count } });
  }

  return createdReels;
};

const seedStories = async (users) => {
  const authors = ['alice_creator', 'bob_photographer', 'carol_fitness', 'dan_chef'];
  for (const username of authors) {
    const u = users[username];
    for (let i = 0; i < randInt(1, 2); i++) {
      const mediaSeed = pickOne(IMAGE_SEEDS);
      const createdAt = hoursAgo(randInt(1, 12));
      const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      await Story.create({
        user_id: u._id,
        media: {
          url: pickImage(mediaSeed, 1080, 1920),
          thumbnail_url: pickImage(mediaSeed, 400, 720),
          type: 'image',
          duration: 5,
          width: 1080,
          height: 1920,
        },
        caption: '',
        visibility: 'public',
        expires_at: expiresAt,
      });
    }
  }
};

const seedAdCampaigns = async (users) => {
  const eve = users.eve_business;
  const alice = users.alice_creator;

  const campaigns = [
    {
      advertiser_id: eve._id,
      name: 'Spring Lookbook — Launch',
      type: 'sponsored_post',
      status: 'active',
      target_audience: { age_range: { min: 18, max: 34 }, genders: ['male', 'female'], locations: ['US', 'CA'], interests: ['fashion', 'art'] },
      budget: { total: 5000, daily_limit: 250, bid_type: 'cpm', bid_amount: 4.5 },
      schedule: { start_date: daysAgo(10), end_date: daysAgo(-20) },
      creative: { media_url: pickImage('canyon', 1200, 628), caption: 'Our Spring collection just dropped.', cta_text: 'Shop now', cta_url: 'https://example.com/spring' },
      metrics: { impressions: 128_400, clicks: 4_820, spend: 1_375 },
    },
    {
      advertiser_id: eve._id,
      name: 'Summer Reels Push',
      type: 'sponsored_reel',
      status: 'paused',
      target_audience: { age_range: { min: 18, max: 44 }, genders: [], locations: ['US'], interests: ['travel', 'fitness'] },
      budget: { total: 2500, daily_limit: 100, bid_type: 'cpc', bid_amount: 0.85 },
      schedule: { start_date: daysAgo(25), end_date: daysAgo(5) },
      creative: { media_url: pickImage('sunset', 1200, 628), caption: 'Summer is for movement.', cta_text: 'Watch', cta_url: 'https://example.com/summer' },
      metrics: { impressions: 88_200, clicks: 2_210, spend: 812 },
    },
    {
      advertiser_id: eve._id,
      name: 'Fall Creator Pilot',
      type: 'sponsored_post',
      status: 'pending_review',
      target_audience: { age_range: { min: 22, max: 40 }, genders: [], locations: ['US', 'UK'], interests: ['business'] },
      budget: { total: 1800, daily_limit: 60, bid_type: 'cpm', bid_amount: 5.2 },
      schedule: { start_date: daysAgo(-2), end_date: daysAgo(-32) },
      creative: { media_url: pickImage('forest', 1200, 628), caption: 'Pilot campaign with Alice.', cta_text: 'Learn more', cta_url: 'https://example.com/fall' },
      metrics: { impressions: 0, clicks: 0, spend: 0 },
    },
    {
      advertiser_id: alice._id,
      name: 'Creator booster — Lisbon',
      type: 'sponsored_post',
      status: 'draft',
      target_audience: { age_range: { min: 18, max: 34 }, genders: [], locations: ['PT'], interests: ['travel'] },
      budget: { total: 400, daily_limit: 40, bid_type: 'cpc', bid_amount: 0.35 },
      schedule: {},
      creative: { media_url: pickImage('harbor', 1200, 628), caption: 'Lisbon guide.', cta_text: 'Read', cta_url: 'https://example.com/lisbon' },
      metrics: { impressions: 0, clicks: 0, spend: 0 },
    },
  ];

  for (const data of campaigns) {
    await AdCampaign.create(data);
  }
};

const seedAdRevenue = async (users) => {
  // Populate the "Revenue" screen for Alice and Carol with a mix of paid and pending entries.
  const creators = [users.alice_creator, users.carol_fitness, users.bob_photographer];
  for (const creator of creators) {
    for (let i = 0; i < 6; i++) {
      const offsetDays = i * 5 + randInt(0, 4);
      const rev = await AdRevenue.create({
        creator_id: creator._id,
        content_type: pickOne(['post', 'reel']),
        content_id: new mongoose.Types.ObjectId(),
        period: `2026-${String(4 - Math.floor(i / 2)).padStart(2, '0')}`,
        impressions: randInt(5_000, 40_000),
        earnings: Number((Math.random() * 80 + 15).toFixed(2)),
        currency: 'USD',
        is_paid: i >= 2,
        paid_at: i >= 2 ? daysAgo(offsetDays) : undefined,
      });
      await AdRevenue.updateOne(
        { _id: rev._id },
        { $set: { created_at: daysAgo(offsetDays) } },
      );
    }
  }
};

const seedCollaborations = async (users, reels) => {
  if (!reels || reels.length === 0) return;

  const scenarios = [
    {
      content: reels.find((r) => r.authorId.toString() === users.alice_creator._id.toString()),
      inviter: users.alice_creator,
      invitee: users.eve_business,
      status: 'pending',
      message: 'Would love to partner on this one.',
    },
    {
      content: reels.find((r) => r.authorId.toString() === users.carol_fitness._id.toString()),
      inviter: users.carol_fitness,
      invitee: users.alice_creator,
      status: 'accepted',
      message: 'Joint reel for the mobility series?',
    },
    {
      content: reels.find((r) => r.authorId.toString() === users.dan_chef._id.toString()),
      inviter: users.dan_chef,
      invitee: users.demouser,
      status: 'pending',
      message: 'Kitchen takeover this Sunday?',
    },
    {
      content: reels.find((r) => r.authorId.toString() === users.bob_photographer._id.toString()),
      inviter: users.bob_photographer,
      invitee: users.eve_business,
      status: 'rejected',
      message: 'Editorial shoot collab.',
    },
  ].filter((s) => s.content);

  for (const s of scenarios) {
    await Collaboration.create({
      content_type: 'reel',
      content_id: s.content.reel._id,
      inviter_id: s.inviter._id,
      invitee_id: s.invitee._id,
      status: s.status,
      watchtime_split: { inviter_percent: 60, invitee_percent: 40 },
      revenue_split: { inviter_percent: 60, invitee_percent: 40 },
      message: s.message,
      responded_at: s.status === 'pending' ? undefined : daysAgo(randInt(1, 6)),
    });
  }
};

const seedAnalytics = async (users) => {
  const creators = ['alice_creator', 'bob_photographer', 'carol_fitness', 'dan_chef', 'eve_business'];
  for (const username of creators) {
    const u = users[username];
    for (let d = 29; d >= 0; d--) {
      const date = daysAgo(d);
      date.setHours(0, 0, 0, 0);
      const reach = randInt(300, 2_400);
      const impressions = reach * randInt(2, 4);
      const engagement = {
        likes_received: randInt(20, 250),
        comments_received: randInt(2, 35),
        shares_received: randInt(1, 20),
        saves_received: randInt(1, 15),
      };
      await UserAnalytics.updateOne(
        { user_id: u._id, date },
        {
          $set: {
            profile_visits: randInt(15, 120),
            impressions,
            reach,
            engagement,
            followers_gained: randInt(0, 12),
            followers_lost: randInt(0, 4),
            story_views: randInt(40, 500),
            reel_views: randInt(100, 3_000),
          },
        },
        { upsert: true },
      );
    }
  }
};

/* ────────────────────────── main ────────────────────────── */

const main = async () => {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');

  await connectDatabase();
  logger.info('Demo data seeding started');

  const users = await seedUsers();
  const demoUserIds = Object.values(users).map((u) => u._id);

  await wipeDemoContent(demoUserIds, { dropUsers: false });
  if (reset) {
    logger.info('Flag --reset provided: recreating demo user documents');
    await wipeDemoContent(demoUserIds, { dropUsers: true });
    return main(); // recurse once to recreate users fresh
  }

  await seedFollows(users);
  await seedPosts(users);
  const reels = await seedReels(users);
  await seedStories(users);
  await seedAdCampaigns(users);
  await seedAdRevenue(users);
  await seedCollaborations(users, reels);
  await seedAnalytics(users);

  logger.info('Demo data seeding complete');

  const summary = {
    users: await User.countDocuments({ username: { $in: DEMO_USERNAMES } }),
    follows: await Follower.countDocuments({
      $or: [
        { follower_id: { $in: demoUserIds } },
        { following_id: { $in: demoUserIds } },
      ],
    }),
    posts: await Post.countDocuments({ user_id: { $in: demoUserIds } }),
    reels: await Reel.countDocuments({ user_id: { $in: demoUserIds } }),
    stories: await Story.countDocuments({ user_id: { $in: demoUserIds } }),
    likes: await Like.countDocuments({ user_id: { $in: demoUserIds } }),
    comments: await Comment.countDocuments({ user_id: { $in: demoUserIds } }),
    campaigns: await AdCampaign.countDocuments({ advertiser_id: { $in: demoUserIds } }),
    collaborations: await Collaboration.countDocuments({
      $or: [
        { inviter_id: { $in: demoUserIds } },
        { invitee_id: { $in: demoUserIds } },
      ],
    }),
    analytics: await UserAnalytics.countDocuments({ user_id: { $in: demoUserIds } }),
  };
  logger.info('Demo summary: ' + JSON.stringify(summary));
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Demo seed failed:', err);
    process.exit(1);
  });
