const express = require('express')
const passport = require('passport')
const axios = require('axios')
// pull in Mongoose model for favorites
const Favorite = require('../models/favorite')

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
const { response } = require('express')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /favorites
router.get('/favorites', requireToken, (req, res, next) => {
  // favorite.owner = user.id
  Favorite.find()
    .populate('owner')
    .then((favorites) => {
      let userFavs = favorites.filter((fav) => fav.owner.id == req.user.id)
      console.log('the favorites:', userFavs)

      // requireOwnership(req, favorites)
      return userFavs.map((favorite) => favorite.toObject())
    })
    .then((favorites) => res.status(200).json({ favorites: favorites }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SHOW
// GET /favorites/<seatGeekId>
router.get('/favorites/:id', (req, res, next) => {
  Favorite.findById(req.params.id)
    .then(handle404)

    .then((favorite) => {
      // make an API call using our saved type and seatGeekId from the database
      // console.log('this is seatgeek', favorite.seatGeekId )
      const type = favorite.type
      const seatGeekId = favorite.seatGeekId
      const apiUrl = 'https://api.seatgeek.com/2/'
      const clientCode = 'MjYzNDYyODl8MTY0ODY4NTU3OS45NjEwNTYy'
      const secretCode =
        '2b6bbdda96ccdb82a057700129eeefa19c774f6ff5e39ab28e15eb61db0013e4'

      axios
        .get(
          `${apiUrl}${type}?client_id=${clientCode}&client_SECRET=${secretCode}&id=${seatGeekId}`
        )

        .then((response) => res.status(200).json({ favorite: response.data }))
        .catch(next)
    })
})

// CREATE
// POST /favorites
router.post('/favorites', requireToken, (req, res, next) => {
  // set owner of new example to be current user
  req.body.favorite.owner = req.user._id
  console.log('back end req.body', req.body.favorite)
  // if name exists, grab name, if not grab title
  let favName = ''
  if (req.body.favorite.name) {
    favName = req.body.favorite.name
  } else {
    favName = req.body.favorite.title
  }
  let favType = ''
  if (req.body.favorite.type == 'band') {
    favType = 'performers'
  }
  //req.body.favorite.type
  const favId = req.body.favorite.id
  const createObject = {
    name: favName,
    type: favType,
    seatGeekId: favId,
    owner: req.user._id,
  }
  Favorite.create(createObject)
    // respond to succesful `create` with status 201 and JSON of new "example"
    .then((favorite) => {
      console.log('the favorite', favorite)
      res.status(201).json({ favorite: favorite.toObject() })
    })
    // if an error occurs, pass it off to our error handler
    // the error handler needs the error message and the `res` object so that it
    // can send an error message back to the client
    .catch(next)
})

// DESTROY
// DELETE /favorites/<id>
router.delete('/favorites/:id', requireToken, (req, res, next) => {
  Favorite.findById(req.params.id)
    .then(handle404)
    .then((favorite) => {
      // throw an error if current user doesn't own `favorite`
      requireOwnership(req, favorite)
      // delete the example ONLY IF the above didn't throw
      favorite.deleteOne()
    })
    // send back 204 and no content if the deletion succeeded
    .then(() => res.sendStatus(204))
    // if an error occurs, pass it to the handler
    .catch(next)
})

module.exports = router
