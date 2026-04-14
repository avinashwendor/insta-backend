const mongoose = require('mongoose');

const serverMemberSchema = new mongoose.Schema(
  {
    server_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'moderator', 'member'],
      default: 'member',
    },
    nickname: String,
    joined_at: { type: Date, default: Date.now },
  },
  {
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

serverMemberSchema.index({ server_id: 1, user_id: 1 }, { unique: true });
serverMemberSchema.index({ user_id: 1 });

const ServerMember = mongoose.model('ServerMember', serverMemberSchema);

module.exports = ServerMember;
