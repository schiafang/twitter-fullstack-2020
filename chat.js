const moment = require('moment')
const db = require('./models')
const Message = db.Message
const User = db.User

module.exports = {
  formatMessage (name, data, avatar, currentUser) {
    return {
      message: data,
      name,
      avatar,
      currentUser,
      time: moment().format('LT')
    }
  },
  getRoom (senderId, receiverId) {
    let room = ''
    if (senderId < receiverId) { room = `${senderId}+${receiverId}` }
    else { room = `${receiverId}+${senderId}` }

    return room
  }
}