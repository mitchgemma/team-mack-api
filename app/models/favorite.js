const mongoose = require('mongoose')

const favoriteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['events', 'performers', 'venues'],
      required: true,
    },
    seatGeekId: {
      type: Number,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Favorite', favoriteSchema)
