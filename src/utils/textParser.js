/**
 * Extract hashtags from text content (captions, descriptions).
 * Matches #word patterns, strips the # prefix, lowercases, and deduplicates.
 *
 * @param {string} text - The text to extract hashtags from
 * @returns {string[]} Array of unique, lowercase hashtag names (without #)
 */
const extractHashtags = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Match #word where word is alphanumeric + underscores, at least 1 char
  const matches = text.match(/#([a-zA-Z0-9_]+)/g);

  if (!matches) {
    return [];
  }

  const hashtags = matches
    .map((tag) => tag.slice(1).toLowerCase()) // Remove # prefix
    .filter((tag) => tag.length >= 1 && tag.length <= 100);

  // Deduplicate
  return [...new Set(hashtags)];
};

/**
 * Extract @mentions from text content.
 * Returns an array of unique usernames (without @).
 *
 * @param {string} text - The text to extract mentions from
 * @returns {string[]} Array of unique, lowercase usernames (without @)
 */
const extractMentions = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches = text.match(/@([a-zA-Z0-9_]+)/g);

  if (!matches) {
    return [];
  }

  const mentions = matches
    .map((mention) => mention.slice(1).toLowerCase())
    .filter((m) => m.length >= 3 && m.length <= 30);

  return [...new Set(mentions)];
};

module.exports = { extractHashtags, extractMentions };
