const mongoose = require('mongoose');

const saveSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target_type: {
      type: String,
      enum: ['post', 'reel'],
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    collection_name: {
      type: String,
      default: 'All Posts',
      trim: true,
      maxlength: 50,
    },
  },
  {
    timestamps: { createdAt: 'created_at' },
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

// One save per user per target
saveSchema.index(
  { user_id: 1, target_type: 1, target_id: 1 },
  { unique: true }
);
// Browse by collection
saveSchema.index({ user_id: 1, collection_name: 1, created_at: -1 });

const Save = mongoose.model('Save', saveSchema);

module.exports = Save;
