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
router.post('/user/:userId', removeBlanks, (req, res, next) => {
  const userId = req.params.userId
  const profile = req.body.profile
  //   console.log('the user', userId)
  //   console.log('the profile', profile)
  // find the user
  console.log('this is the req.body', req.body.profile)
  Profile.create(req.body.profile)
    // handle what happens if no user is found
    .then(handle404)
    .then((user) => {
      res.status(201).json({ profile: user.toObject() })
      console.log('this is the new user', user)
      return user.save()
    })
    // catch errors and send to the handler
    .catch(next)
})

// UPDATE
//PATCH /user/<user_id>/<profile_id>
router.patch(
  '/user/:profileId',
  requireToken,
  removeBlanks,
  (req, res, next) => {
    const userId = req.params.userId
    const profileId = req.params.profileId + ''

    Profile.findById(profileId)
      .populate('owner')
      .then(handle404)
      .then((user) => {
        // keeping all of these to troubleshoot with Timm
        // also route seems to be working without the profileId param
        console.log('user.profile.id', user.profile.id)
        console.log('the user.profile ya know', user.profile)
        console.log('req.body.profile', req.body.profile)

        // const theProfile = user.profile.id(profileId)
        // console.log('the profile', theProfile)
        user.profile = req.body.profile
        console.log('req', req)
        console.log('user', user)
        // requireOwnership causing issues for route - put on back burner and ask Timm
        // requireOwnership(req, user)

        return user.save()
      })
      .then(() => res.sendStatus(204))
      .catch(next)
  }
)

module.exports = router
