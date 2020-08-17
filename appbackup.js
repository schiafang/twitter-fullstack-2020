// use helpers.getUser(req) to replace req.user
// use helpers.ensureAuthenticated(req) to replace req.isAuthenticated()

if (process.env.NODE_ENV !== 'production') { require('dotenv').config() }

const express = require('express')
const exhbs = require('express-handlebars')
const bodyPaser = require('body-parser')
const methodOverride = require('method-override')
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('./config/passport')
const middleware = require('./config/middleware')
const helpers = require('./_helpers')
const socket = require('socket.io')
const db = require('./models')
const Message = db.Message
const PrivateMessage = db.PrivateMessage
const User = db.User
const moment = require('moment')
const { formatMessage, getRoom } = require('./chat')
const { Op } = require("sequelize")
const { raw } = require('body-parser')

const app = express()
const PORT = process.env.PORT || 3000

app.engine('handlebars', exhbs({ defaultLayout: 'main', helpers: require('./config/handlebars-helpers') }))
app.set('view engine', 'handlebars')
app.use(express.static('public'))
app.use(bodyPaser.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(session({ secret: process.env.SECRET, resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(middleware.topUsers)
app.use(middleware.setLocals)

const server = app.listen(PORT, () => console.log(`Alphitter is listening on port ${PORT}!`))
const io = socket(server)

io.on('connection', socket => {
  let onlineUsers = []

  socket.on('login', user => {
    //取得目前使用者資料
    socket.user = user
    socket.user.currentUser = true

    //更新線上使用者
    onlineUsers.push({ id: socket.user.id, name: socket.user.name, account: socket.user.account, avatar: socket.user.avatar })
    let set = new Set()
    onlineUsers = onlineUsers.filter(item => !set.has(item.id) ? set.add(item.id) : false)

    socket.emit('message', `Hello, ${socket.user.name}`)
    io.emit('onlineUsers', onlineUsers)
  })
  socket.broadcast.emit('message', 'eeeeeee')

  // get chat history
  // let historyMessages
  // await Message.findAll({ include: [User], order: [['createdAt', 'ASC']] })
  //   .then(data => {
  //     historyMessages = data.map(item => ({
  //       message: item.dataValues.message,
  //       name: item.dataValues.User.name,
  //       avatar: item.dataValues.User.avatar,
  //       currentUser: user.id === item.dataValues.User.id ? true : false,
  //       time: moment(item.dataValues.createdAt).format('LT')
  //     }))
  //   })

  // emit history message to user 
  // socket.emit('history', historyMessages)



  // socket.broadcast.emit('message', `${socket.user.name} join chatroom`)

  // update online users
  io.emit('onlineUsers', onlineUsers)

  // user emit message to all user 
  socket.on('chat', data => {
    // Message.create({ message: data, UserId: socket.user.id })
    console.log('222222222')
    console.log(onlineUsers)
    io.emit('chat', formatMessage(socket.user.name, data, socket.user.avatar, socket.user.currentUser))
  })

  // listen typing
  // socket.on('typing', data => {
  //   data.name = socket.user.name
  //   socket.broadcast.emit('typing', data)
  // })

  // user leave room, reset onlineUsers
  socket.on('disconnect', () => {
    // onlineUsers = onlineUsers.filter(user => user.id !== id)
    // io.emit('onlineUsers', onlineUsers)
    // socket.broadcast.emit('typing', { isExist: false })
    // socket.broadcast.emit('message', `${socket.user.name} left chatroom`)
  })

  /** private messge */
  // socket.on('privateMessage', async data => {
  //   const senderId = Number(socket.user.id)
  //   let receiverId = data
  //   let historyMessages
  //   const room = getRoom(senderId, receiverId)
  //   socket.join(room)
  //   console.log(receiverId)

  //   await PrivateMessage.findAll({
  //     where: {
  //       [Op.or]:
  //         [{ [Op.and]: [{ senderId }, { receiverId }] },
  //         { [Op.and]: [{ senderId: receiverId }, { receiverId: senderId }] }],
  //     },
  //     include: [{ model: User, as: 'Sender' }, { model: User, as: 'Receiver' }],
  //   }).then((data) => {
  //     return historyMessages = data.map(item => ({
  //       message: item.dataValues.message,
  //       name: item.dataValues.Sender.name,
  //       avatar: item.dataValues.Sender.avatar,
  //       currentUser: user.id === item.dataValues.Sender.id ? true : false,
  //       time: moment(item.dataValues.createdAt).format('LT')
  //     }))
  //   }).then((historyMessages) => {
  //     io.to(room).emit('privateHistory', historyMessages)
  //   })

  //   // find history messages
  //   socket.on('sendPrvate', async data => {
  //     io.to(room).emit('sendPrivate', formatMessage(user.name, data.message, user.avatar, user.currentUser))
  //     PrivateMessage.create({
  //       message: data.message,
  //       receiverId: data.receiverId,
  //       senderId
  //     })
  //   })

  // })


})

require('./routes/index')(app, passport)

module.exports = app