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
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /favorites
router.get('/favorites', requireToken, (req, res, next) => {
  Favorite.find()
    .then((favorites) => {
      return favorites.map((favorite) => favorite.toObject())
    })
    .then((favorites) => res.status(200).json({ favorites: favorites }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// SEARCH
// GET
router.get('/search/:type/:name', (req, res, next) => {
  const type = req.params.type
  const searchItem = req.params.name
  const apiUrl = 'https://api.seatgeek.com/2/'
  const clientCode = 'MjYzNDYyODl8MTY0ODY4NTU3OS45NjEwNTYy'
  const secretCode =
    '2b6bbdda96ccdb82a057700129eeefa19c774f6ff5e39ab28e15eb61db0013e4'

  if (type === 'events') {
    axios
    .get(
      `${apiUrl}${type}?client_id=${clientCode}&client_SECRET=${secretCode}&q=${searchItem}&taxonomies.name=concert`
    )
    .then((response) => res.status(200).json(response.data))
    .catch(next)
  } else if (type === 'performers') {
    axios
    .get(
      `${apiUrl}${type}?client_id=${clientCode}&client_SECRET=${secretCode}&q=${searchItem}&taxonomies.name=concerts`
    )
    .then((response) => res.status(200).json(response.data))
    .catch(next)
  } else if (type === 'venues'){
    axios
    .get(
      `${apiUrl}${type}?client_id=${clientCode}&client_SECRET=${secretCode}&q=${searchItem}`
    )
    .then((response) => res.status(200).json(response.data))
    .catch(next)
  }
    // .then(response => console.log(JSON.stringify(response.data: )))
    // .then((response) => console.log('this is the type', {taxonomies: taxonomies}))
    // if an error occurs, pass it to the handler
})

// SHOW
// GET /favorites/<seatGeekId>
router.get('/favorites/:id', requireToken, (req, res, next) => {
  // req.params.id will be set based on the `:id` in the route
  Favorite.findById(req.params.id)
    .then(handle404)
    // if `findById` is succesful, respond with 200 and "example" JSON
    .then((favorite) => res.status(200).json({ favorite: favorite.toObject() }))
    // if an error occurs, pass it to the handler
    .catch(next)
})

// CREATE
// POST /favorites
router.post('/favorites', requireToken, (req, res, next) => {
	// set owner of new example to be current user
	req.body.favorite.owner = req.user.id

	Favorite.create(req.body.favorite)
		// respond to succesful `create` with status 201 and JSON of new "example"
		.then((favorite) => {
			res.status(201).json({ favorite: favorite.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})

module.exports = router
