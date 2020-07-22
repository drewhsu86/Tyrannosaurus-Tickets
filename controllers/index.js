const db = require('../db')
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/users")
const Ticket = require("../models/tickets")
const Event = require("../models/events")

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// include this every time db is used 
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// salt rounds for bcrypt
const SALT_ROUNDS = 11

// token key for jwt 
const TOKEN_KEY = process.env.TOKEN_KEY 
const QR_TOKEN_KEY = process.env.QR_TOKEN_KEY 

// write all functions that are not for router here

// ===============================
// 
//  Functions NOT For Router
// 
// ===============================

// given the name on the ticket, userID and eventID, generate an encrypted string and return it 
const encryptTicketQR = async (user_ID, event_ID, name_on_ticket) => {
  try {
    const time_generated = new Date().toUTCString()

    const payload = {
      user_ID,
      event_ID,
      name_on_ticket,
      time_generated
    }

    encrypted_string = jwt.sign(payload, QR_TOKEN_KEY)

    return { encrypted_string, time_generated }
  } catch (error) {
    console.log(error)
  }
}

// decrypt encrypted string 
const decryptTicketQR = async (qr_string) => {
  try {
    const decrypted_object = jwt.verify(qr_string, QR_TOKEN_KEY)

    return decrypted_object
  } catch (error) {
    console.log(error)
  }
}

// given the ticket_ID and its corresponding userID and eventID, link this ticket in the ticket_IDs field of the corresponding user and event 
const linkTicket = async (ticket_ID, user_ID, event_ID) => {
  try {
    console.log(user_ID)
    console.log(event_ID)
    
    const user = await User.findById(user_ID)
    const event = await Event.findById(event_ID)

    console.log(user)
    console.log(event)

    user.ticket_IDs.push({ ticket_ID, event_ID })
    await user.save()

    event.ticket_IDs.push({ ticket_ID, user_ID })
    await event.save()

  } catch (error) {
    console.log(error)
  }
}

// given a req, determine the user_ID from the token. this lets us know which user based on their token has tried to access a route 
const userOfRequest = (req) => {
  try {
    const token = req.headers.authorization.split(" ")[1]
    const legit = jwt.verify(token, TOKEN_KEY)
    
    if (legit) {
      return legit.id 
    }
    return false 
  } catch (error) {
    console.log(error)
    return false 
  }
}

// write router functions here, all take args req and res from router

// ===============================
// 
//  USER - signup, signin, verify
// 
// ===============================

//verify user
const verifyUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]
    const legit = jwt.verify(token, TOKEN_KEY)
    console.log(legit)
    if (legit) {
      res.json(legit)
    }
  } catch (error) {
    res.status(401).send('Not Authorized')
  }
}

//sign-in
const signIn = async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username: username })
    if (await bcrypt.compare(password, user.password_digest)) {
      const payload = {
        id: user._id,
        username: user.username,
        user_real_name: user.user_real_name 
      }
      console.log('about to sign')
      const token = jwt.sign(payload, TOKEN_KEY)
      console.log('token')
      return res.status(201).json({ user, token })
    } else {
      res.status(401).send("Invalid Credentials")
    }
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

//sign-up
const signUp = async (req, res) => {
  try {
    const { username, password, user_real_name } = req.body

    const password_digest = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await new User({
      username,
      password_digest,
      user_real_name
    })
    await user.save()

    const payload = {
      id: user._id,
      username: user.username,
      user_real_name: user.user_real_name 
    }

    const token = jwt.sign(payload, TOKEN_KEY)

    return res.status(201).json({ user, token })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// ===============================
// 
//  Events 
// 
// ===============================

// get all events but respond without ticket info 
const getEvents = async (req, res) => {
  try {
    const events = await Event.find()

    // we are going to remove the key/value pair of ticket_IDs before sending it in the response 
    // delete <object>.<keyname> doesn't seem to work so the property is set to null for now (normally would be an array)
    events.forEach(event => {
      event.ticket_IDs = null
    })

    return res.json(events)

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// get all events that have tickets of the user whose token is detected 
const getUserEvents = async (req, res) => {
  try {
    const user_ID = userOfRequest(req) 
    if (user_ID) {
      // query events where user_ID is in the array ticket_IDs.user_ID 
      const foundEvents = await Event.find({
        'ticket_IDs.user_ID': user_ID 
      })

      // for each event, filter out all tickets unless they match the user_ID (because the others do not belong to this user)
      const events = foundEvents.map(event => {
        // ticket_IDs is an array holding objects with 2 key/value pairs: ticket_ID and user_ID
        user_ticket_count = event.ticket_IDs.filter(ticket_obj => {
          return ticket_obj.user_ID.toString() === user_ID.toString()
        }).length 

        // don't include array of tickets in this response, they will be included in route for requesting only one event 
        event.ticket_IDs = null 

        return {event_data: event, user_ticket_count}
      })

      return res.json(events)
    } else {
      res.status(400).json({error: "No valid user token detected."})
    }

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// get all events that have tickets of the user whose token is detected 
const getUserEvent = async (req, res) => {
  try {
    // get user id from token 
    const user_ID = userOfRequest(req) 

    // get event id from req.params 
    const event_ID = req.params.id 

    const event = await Event.findById(event_ID).populate('ticket_IDs.ticket_ID')

    //filter out all tickets unless they match the user_ID (because the others do not belong to this user)
    
    // ticket_IDs is an array holding objects with 2 key/value pairs: ticket_ID and user_ID
    event.ticket_IDs = event.ticket_IDs.filter(ticket_obj => {
      return ticket_obj.user_ID.toString() === user_ID.toString()
    })

    return res.json(event)

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

// ===============================
// 
//  EXPORT FUNCTIONS 
// 
// ===============================

// export functions to be used in routes 
module.exports = {
  encryptTicketQR, decryptTicketQR, linkTicket,
  signIn, signUp, verifyUser,
  getEvents, getUserEvents, getUserEvent 
}