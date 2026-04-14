const mongoose = require('mongoose');

const audioTrackSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    artist: { type: String, required: true, trim: true, maxlength: 200 },
    audio_url: { type: String, required: true },
    cover_url: String,
    duration: { type: Number, required: true },
    genre: { type: String, trim: true },
    is_original: { type: Boolean, default: false },
    original_reel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel' },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usage_count: { type: Number, default: 0 },
    is_licensed: { type: Boolean, default: true },
    is_banned: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

audioTrackSchema.index({ title: 'text', artist: 'text' });
audioTrackSchema.index({ usage_count: -1 });
audioTrackSchema.index({ uploaded_by: 1 });
audioTrackSchema.index({ genre: 1, usage_count: -1 });

const AudioTrack = mongoose.model('AudioTrack', audioTrackSchema);

module.exports = AudioTrack;
