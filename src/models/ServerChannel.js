const mongoose = require('mongoose');

const serverChannelSchema = new mongoose.Schema(
  {
    server_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Server',
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    type: {
      type: String,
      enum: ['text', 'voice', 'announcement'],
      default: 'text',
    },
    topic: { type: String, default: '', maxlength: 1024 },
    position: { type: Number, default: 0 },
    is_archived: { type: Boolean, default: false },
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

serverChannelSchema.index({ server_id: 1, position: 1 });

const ServerChannel = mongoose.model('ServerChannel', serverChannelSchema);

module.exports = ServerChannel;
