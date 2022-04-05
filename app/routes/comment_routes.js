const express = require('express')
const passport = require('passport')
const axios = require('axios')
// pull in Mongoose model for favorites
const Comment = require('../models/comment')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { favorite: { name: '', type: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// CREATE
// POST /comment
router.post('/comments', requireToken, (req, res, next) => {
  // set owner of new example to be current user
  req.body.comment.owner = req.user.id

  Comment.create(req.body.comment)
    // respond to succesful `create` with status 201 and JSON of new "example"
    .then((comment) => {
      //   console.log('this is created comment ', req.body.comment)
      res.status(201).json({ comment: comment.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// DESTROY
// DELETE /favorites/<id>
router.delete('/comments/:id', requireToken, (req, res, next) => {
  Comment.findById(req.params.id)
    .then(handle404)
    .then((comment) => {
      // throw an error if current user doesn't own `favorite`
      requireOwnership(req, comment)
      // delete the example ONLY IF the above didn't throw
      comment.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// UPDATE
// PATCH /comment/<id>
router.patch('/comments/:id', requireToken, removeBlanks, (req, res, next) => {
  delete req.body.owner
  console.log('our params ', req.params.id)

  Comment.findById(req.params.id)
    .then(handle404)

    .then((comment) => {
      requireOwnership(req, comment)
      console.log('this is updated comment ', req.body.comment)

      return comment.updateOne(req.body.comment)
    })
    .then(() => res.sendStatus(204))
    .catch(next)
})

// // UPDATE
// // PATCH /pets/624470c12ed7079ead53d4df
// router.patch('/pets/:id', requireToken, removeBlanks, (req, res, next) => {
//     // if the client attempts to change the owner of the pet, we can disallow that from the getgo
//     delete req.body.owner
//     // then we find the pet by the id
//     Pet.findById(req.params.id)
//     // handle our 404
//         .then(handle404)
//     // requireOwnership and update the pet
//         .then(pet => {
//             requireOwnership(req, pet)

//             return pet.updateOne(req.body.pet)
//         })
//     // send a 204 no content if successful
//         .then(() => res.sendStatus(204))
//     // pass to errorhandler if not successful
//         .catch(next)
// })

module.exports = router
