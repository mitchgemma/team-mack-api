// import our dependecies, middleware and models
const express = require('express')
const passport = require('passport')
const User = require('../models/user')
const customErrors = require('../../lib/custom_errors')

const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const requireToken = passport.authenticate('bearer', { session: false })
const removeBlanks = require('../../lib/remove_blank_fields')
const Profile = require('../models/profile')

const router = express.Router()

// ROUTES
// POST -> create a profile
// path might need to be changed
router.post('/user', requireToken, removeBlanks, (req, res, next) => {
  //   console.log('the user', userId)
  //   console.log('the profile', profile)
  // find the user
  req.body.profile.owner = req.user.id
  console.log('this is the req.body', req.body.profile)
  Profile.create(req.body.profile)
    // handle what happens if no user is found
    .then(handle404)
    .then((profile) => {
      res.status(201).json({ profile: profile.toObject() })
      console.log('this is the new profile', profile)
      return profile.save()
    })
    // catch errors and send to the handler
    .catch(next)
})

// SHOW
// GET /user/<profileId>
router.get('/profile', requireToken, removeBlanks, (req, res, next) => {
  console.log('the request', req.user.id)

  console.log('the request', req)
  Profile.findOne({ owner: req.user.id })
    .populate('owner')
    .then(handle404)
    .then((profile) => {
      res.status(200).json(profile.toObject()),
        console.log('the response for profile', profile)
    })
    .catch(next)
})

// UPDATE
//PATCH /user/<user_id>/<profile_id>
router.patch(
  '/user/:profileId',
  requireToken,
  removeBlanks,
  (req, res, next) => {
    const profileId = req.params.profileId
    console.log('back end req.body', req.body)
    Profile.findById(profileId)
      .populate('owner')
      .then(handle404)
      .then((profile) => {
        console.log('the profile', profile)

        console.log('req', req)
        console.log('user', profile)
        // requireOwnership(req, profile)
        // profile = req.body.profile
        return profile.updateOne(req.body.profile)
      })
      .then(() => res.sendStatus(204))
      .catch(next)
  }
)

module.exports = router
