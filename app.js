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

let name
app.use((req, res, next) => {
  if (helpers.getUser(req)) {
    ({ id, name, account, avatar } = helpers.getUser(req))
  }
  next()
})

let onlineUsers = []

io.on('connection', async socket => {

  //---------------------- 公開聊天室 ----------------------//
  //取得聊天室紀錄，發送紀錄
  let historyMessages
  await Message.findAll({ include: [User], order: [['createdAt', 'ASC']] })
    .then(data => {
      historyMessages = data.map(item => ({
        message: item.dataValues.message,
        name: item.dataValues.User.name,
        avatar: item.dataValues.User.avatar,
        time: moment(item.dataValues.createdAt).format('LT')
      }))
      return historyMessages
    })
    .then(historyMessages => socket.emit('history', historyMessages))

  //使用者上線更新資料，發送廣播
  socket.on('login', user => {
    // socket.user = user
    // socket.user.currentUser = true 

    onlineUsers.push({ id: user.id, name: user.name, account: user.account, avatar: user.avatar, socketId: socket.id })
    let set = new Set()
    onlineUsers = onlineUsers.filter(item => !set.has(item.id) ? set.add(item.id) : false)

    socket.emit('message', `Hello, ${socket.user.name}`)
    socket.broadcast.emit('message', `${socket.user.name} join chatroom`)

    io.emit('onlineUsers', onlineUsers)
  })

  //使用者發送訊息至聊天室
  socket.on('chat', async data => {
    Message.create({ message: data.message, UserId: data.id })
    io.emit('chat', formatMessage(data.name, data.message, data.avatar, data.id))
  })

  // 使用者離開聊天室
  socket.on('disconnect', () => {
    onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id)
    io.emit('onlineUsers', onlineUsers)
    socket.broadcast.emit('message', `${name} left chatroom`)
  })

  //其他事件：動態監聽使用者輸入狀態
  socket.on('typing', data => {
    socket.broadcast.emit('typing', data)
  })

  //---------------------- 私人訊息 ----------------------//
  socket.on('privateMessage', async data => {
    const senderId = Number(data.user.id)
    let receiverId = data.receiverId
    let historyMessages

    const room = getRoom(senderId, receiverId)

    if (receiverId !== 0) {
      socket.join(room)

      await PrivateMessage.findAll({
        where: {
          [Op.or]:
            [{ [Op.and]: [{ senderId }, { receiverId }] },
            { [Op.and]: [{ senderId: receiverId }, { receiverId: senderId }] }],
        },
        include: [{ model: User, as: 'Sender' }, { model: User, as: 'Receiver' }],
      }).then((data) => {
        return historyMessages = data.map(item => ({
          senderId: item.dataValues.Sender.id,
          receiverId: item.dataValues.Receiver.id,
          message: item.dataValues.message,
          name: item.dataValues.Sender.name,
          avatar: item.dataValues.Sender.avatar,
          currentUser: item.dataValues.Sender.id,
          time: moment(item.dataValues.createdAt).format('LT')
        }))
      }).then(historyMessages => {

        io.to(room).emit('privateHistory', historyMessages)
      })

      socket.on('sendPrvate', data => {
        io.to(room).emit('sendPrivate', formatMessage(user.name, data.message, user.avatar, data.senderId))

        PrivateMessage.create({
          message: data.message,
          receiverId: data.receiverId,
          senderId
        })
      })
    }
  })


})

require('./routes/index')(app, passport)

module.exports = app