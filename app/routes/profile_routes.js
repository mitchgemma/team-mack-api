// import our dependecies, middleware and models
const express = require('express')
const passport = require('passport')
const User = require('../models/user')
const customErrors = require('../../lib/custom_errors')

const handle404 = customErrors.handle404
const requireOwnership = customErrors.requireOwnership
const requireToken = passport.authenticate('bearer', { session: false })
const removeBlanks = require('../../lib/remove_blank_fields')

const router = express.Router()

// ROUTES
// POST -> create a profile
// path might need to be changed
router.post('/:userId', removeBlanks, (req, res, next) => {
  // get our toy from req.body
  const userId = req.params.userId
  const profile = req.body.profile
  console.log('the user', userId)
  console.log('the profile', profile)
  // find the pet
  User.findById(userId)
    // handle what happens if no user is found
    .then(handle404)
    .then((user) => {
      console.log('this is the user', user)
      console.log('this is the req.body', req.body)
      // push the toy to the toys array
      //   pet.toys.push(toy)
      user.profile.push(profile)
      // save the pet
      return user.save()
    })
    // then we send the pet as json
    .then((user) => res.status(201).json({ profile: user }))
    // catch errors and send to the handler
    .catch(next)
})

module.exports = router
