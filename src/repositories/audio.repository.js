const BaseRepository = require('./base.repository');
const AudioTrack = require('../models/AudioTrack');

class AudioTrackRepository extends BaseRepository {
  constructor() {
    super(AudioTrack);
  }

  async getTrending(options = {}) {
    return this.findMany(
      { is_banned: false },
      { ...options, sort: { usage_count: -1 } }
    );
  }

  async searchTracks(query, options = {}) {
    return this.findMany(
      {
        $text: { $search: query },
        is_banned: false,
      },
      { ...options, sort: { score: { $meta: 'textScore' } } }
    );
  }

  async getByGenre(genre, options = {}) {
    return this.findMany(
      { genre, is_banned: false },
      { ...options, sort: { usage_count: -1 } }
    );
  }

  async incrementUsage(audioId) {
    return this.incrementById(audioId, { usage_count: 1 });
  }
}

module.exports = {
  audioTrackRepository: new AudioTrackRepository(),
};
