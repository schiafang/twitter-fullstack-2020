$(function () {
  const socket = io()
  const chatForm = document.querySelector('#chat-form')
  const input = document.querySelector('#input')
  const chatContent = document.querySelector('.chat-main')
  const typing = document.querySelector('.typing')
  const onlineUserColumn = document.querySelector('.online-user-column')
  let onlineUsers = []

  const name = document.querySelector('.user-name').textContent
  const id = document.querySelector('.user-id').textContent
  const account = document.querySelector('.user-account').textContent
  const avatar = document.querySelector('.user-avatar').textContent
  const user = { name, id, account, avatar }

  socket.emit('login', user)

  // emit input message to socket
  chatForm.addEventListener('submit', event => {
    event.preventDefault()
    if (input.value.length === 0) { return false }
    socket.emit('chat', { message: input.value, isSelf: false, id, name, avatar })
    socket.emit('typing', { isExist: false })
    input.value = ''
    return false
  })

  // got history message 
  socket.on('history', data => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].currentUser === true) {
        output.innerHTML += `
        <div class="self-message">
            <div class="self-text">${data[i].message}</div>
            <div class="chat-time">${data[i].time}</div>
          </div>
        `
      }
      else {
        output.innerHTML += `
          <div class="chat-message">
            <div class="chat-avatar" style="background: url(${data[i].avatar}),#C4C4C4; background-position:center;background-size:cover;">
              </div>
            <div class="column">
              <div class="chat-text"><span>${data[i].name} :</span>${data[i].message}</div>
              <div class="chat-time">${data[i].time}</div>
            </div>
          </div>
        `
      }
    }

    chatContent.scrollTop = chatContent.scrollHeight
  })

  // message from server
  socket.on('message', data => {
    output.innerHTML += `<div class="broadcast"> <div><span>${data}</span></div></div>`

    chatContent.scrollTop = chatContent.scrollHeight
  })

  // message from user
  socket.on('chat', data => {
    console.log(data)
    if (data.currentUser === id) {
      output.innerHTML += `
      <div class="self-message">
          <div class="self-text">${data.message}</div>
          <div class="chat-time">${data.time}</div>
        </div>
      `
    }
    else {
      output.innerHTML += `
        <div class="chat-message">
          <div class="chat-avatar" style="background: url(${data.avatar}),#C4C4C4; background-position:center;background-size:cover;">
            </div>
          <div class="column">
            <div class="chat-text"><span>${data.name} :</span>${data.message}</div>
            <div class="chat-time">${data.time}</div>
          </div>
        </div>
      `
    }

    chatContent.scrollTop = chatContent.scrollHeight
  })

  // get online users
  socket.on('onlineUsers', data => {
    onlineUsers.push(data)
    let allItem = ``
    for (let i = 0; i < data.length; i++) {
      allItem += `
        <div class="online-user-item ">
          <div class="online-user-avatar"
            style="background: url(${data[i].avatar}),#C4C4C4; background-position:center;background-size:cover;">
          </div>
          <div class="online-user-name">${data[i].name} <span>@${data[i].account}</span></div>
        </div>
      `
    }

    onlineUserColumn.innerHTML = allItem
  })

  // listening other users typing
  input.addEventListener('input', (e) => {
    if (e.target.value) {
      socket.emit('typing', { isExist: true, name })
    } else {
      socket.emit('typing', { isExist: false, name })
    }
  })
  socket.on('typing', data => {
    console.log(data)
    if (data.isExist) {
      typing.innerHTML = `${data.name} is typing...`
    } else {
      typing.innerHTML = ''
    }
  })

})
