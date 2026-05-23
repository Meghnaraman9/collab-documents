const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled Document',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    activeUsers: {
      type: Number,
      default: 0,
    },
    lastEditedBy: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
