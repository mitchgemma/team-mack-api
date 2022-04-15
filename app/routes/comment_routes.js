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

//GET
router.get('/comments/:id', (req, res, next) => {
  Comment.find({seatGeekId: req.params.id})
    .populate('owner')
    .then((comments) => res.status(200).json({ comments: comments }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /comments/<id>
router.get('/comments/:id', (req, res, next) => {
  // we get the id from req.params.id -> :id
  Comment.findById(req.params.id)
      .populate('owner')
      .then(handle404)
      .then(comment => res.status(200).json({ comment: comment.toObject() }))
      .catch(next)
})

// CREATE
// POST /comment
router.post('/comments/:id', (req, res, next) => { 
  // req.body.comment.owner = req.user.id
  Comment.create(req.body.comment)
    // respond to succesful `create` with status 201 and JSON of new "example"
    .then((comment) => {
      //   console.log('this is created comment ', req.body.comment)
      res.status(201).json({ comment: comment.toObject() })
    })
    .catch(next)
})

// DESTROY
// DELETE /favorites/<id>
router.delete('/comments/:id', (req, res, next) => {
  Comment.findById(req.params.id)
    .then(handle404)
    .then((comment) => {
      // throw an error if current user doesn't own `favorite`
      // requireOwnership(req, comment)
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

module.exports = router
