const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
	{
		text: {
			type: String,
			required: true,
		},
		seatGeekId: {
			type: Number,
			required: true,
			},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			}
		},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Comment', commentSchema)