$(function () {
  const socket = io()
  const mailForm = document.querySelector('#mail-form')
  const input = document.querySelector('#input')
  const mailContent = document.querySelector('.mail-main')
  const output = document.querySelector('#output-mail')
  const receiverId = Number(location.pathname.slice(9, 20))
  const name = document.querySelector('.user-name').textContent
  const id = document.querySelector('.user-id').textContent
  const account = document.querySelector('.user-account').textContent
  const avatar = document.querySelector('.user-avatar').textContent
  const user = { name, id, account, avatar }

  socket.emit('privateMessage', receiverId)

  // emit input message to socket
  mailForm.addEventListener('submit', event => {
    event.preventDefault()
    if (input.value.length === 0) { return false }
    const message = input.value
    socket.emit('sendPrvate', { message, receiverId, senderId: id })
    input.value = ''
    return false
  })

  socket.on('privateHistory', data => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].currentUser === Number(id)) {
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

    mailContent.scrollTop = mailContent.scrollHeight
  })

  socket.on('sendPrivate', data => {
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

    mailContent.scrollTop = mailContent.scrollHeight
  })

})
