const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 1000 },
    icon_url: String,
    banner_url: String,
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    member_count: { type: Number, default: 1 },
    invite_code: {
      type: String,
      unique: true,
      required: true,
    },
    is_public: { type: Boolean, default: true },
    categories: [{ type: String, trim: true }],
    rules: { type: String, default: '' },
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

serverSchema.index({ invite_code: 1 }, { unique: true });
serverSchema.index({ is_public: 1, member_count: -1 });
serverSchema.index({ owner_id: 1 });

const Server = mongoose.model('Server', serverSchema);

module.exports = Server;
