const db = require("../db")
const User = require("../models/users")
const Ticket = require("../models/tickets")
const Event = require("../models/events")
const bcrypt = require("bcrypt")
const { encryptTicketQR, decryptTicketQR, linkTicket } = require("../controllers")

db.on("error", console.error.bind(console, "MongoDB Connection Error:"))

const main = async () => {

  try {

    // clear all entries on all relevant tables before seeding
    await User.deleteMany()
    await Ticket.deleteMany()
    await Event.deleteMany()

    // create a basic user for testing 
    const userPW = await bcrypt.hash('123456', 11)

    // seed at least one user 
    const users = [{
      username: "user1",
      user_real_name: "User Theuser",
      password_digest: userPW,
      ticket_IDs: []
    }]

    await User.insertMany(users) 
    console.log('Seeded initial users')

    // seed at least one event 
    const events = [{
      event_name: 'Eventapalooza',
      event_location: '100 Event Street, New York NY 99999',
      event_startTime: 'July 20th, 3000, 10:00 UTC',
      event_description: 'Welcome to Eventapalooza! For those attending, please find the marked red kiosk and scan the QR code displayed on your phone (found in the tickets section) upon arrival!',
      ticket_IDs: []
    }]

    await Event.insertMany(events) 
    console.log('Seeded initial events')


    // use the user_ID, ticket_ID and name_on_ticket to generate a qrCode (actually from jsonwebtoken.sign) that's encrypted 

    const user1 = await User.findOne({ username: 'user1' })
    const userID = user1._id 

    const event1 = await Event.findOne({ event_name: 'Eventapalooza' })
    const eventID = event1._id 

    console.log('userID, eventID: ', userID, eventID)

    const name_on_ticket = 'Bob Bobberson'

    // insert ticket into database 
    const makeTicket1 = {
      user_ID: userID,
      event_ID: eventID,
      name_on_ticket,
      ticket_scanned: false 
    }

    const tickets = await Ticket.insertMany(makeTicket1)

    const ticket1 = tickets[0]

    // make encrypted code from ticket and name 
    const qrCode = await encryptTicketQR(ticket1._id, name_on_ticket)
    
    ticket1.qr_code_encrypted = qrCode 
    ticket1.time_last_generated = qrCode.time_generated

    ticket1.save()

    // check decryption
    const decryption = await decryptTicketQR(qrCode)

    console.log('- decryption -')
    console.log(decryption)

    
    console.log('Seeded initial tickets')

    // link ticket to user and event via IDs    
    const ticketID = ticket1._id 

    await linkTicket(ticketID, userID, eventID)

  } catch (er) {
    console.log(er)
  }

}

const run = async () => {
  await main()
  db.close()
}

run()