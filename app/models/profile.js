// import dependencies
const mongoose = require('mongoose')
// profile is a subdocument, i.e. NOT a model

// we dont need to get model from mongoose, so in order to save some real estate, we'll just use the standard syntax for creating a schema like this:
const profileSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipcode: {
      type: String,
      required: true,
    },
    genres: [String],
    openToNewMusic: {
      type: Boolean,
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

module.exports = mongoose.model('Profile', profileSchema)
