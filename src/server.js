require('dotenv/config')

const net = require('net');
const { faker } = require('@faker-js/faker')

const { write } = require('./functions/writefile')

const clients = []

const server = net.createServer((socket) => {
  socket.write('You joined on chat\r\n')
  socket.write('------------------------CHAT------------------------\r\n\n')

  socket.pipe(socket)
})

const commands = {
  QUIT: '!quit',
  CHANGE_NAME: '!change_user',
  CLIENTS_ONLINE: '!users_online'
}

const emitMessageNewUserJoined = (user, client_connected) => {
  clients
  .filter(to => to.client !== client_connected)
  .forEach(clientTo => {
    clientTo.client.write('----------------------------------------------------\n')
    clientTo.client.write(`${user} Joined\n`)
    clientTo.client.write('----------------------------------------------------\n')
  })
}

const broadcast = (message, client_connected) => {
  let canSendMessage = true

  if(message.toString().startsWith(commands.QUIT)) {
    const indexClient = clients.findIndex(from => from.client === client_connected)

    clients
    .filter(to => to.client !== client_connected)
    .forEach(clientTo => {
      clientTo.client.write('----------------------------------------------------\n')
      clientTo.client.write(`${clients[indexClient].user} Exited\n`)
      clientTo.client.write('----------------------------------------------------\n')
    })

    clients[indexClient].client.end()
    
    canSendMessage = false
  }

  if(message.toString().startsWith(commands.CHANGE_NAME)) {
    const [_command, userName] = message.toString().split(': ')

    changeUserName(userName.trim(), client_connected)

    canSendMessage = false
  }

  if(message.toString().startsWith(commands.CLIENTS_ONLINE)) {
    const [ from ] = clients.filter(from => from.client === client_connected)

    from.client.write('----------------------------------------------------\n')
    clients.forEach(clientTo => from.client.write(`> ${clientTo.user}\n`))
    from.client.write('----------------------------------------------------\n')

    canSendMessage = false
  }

  if(!Object.values(commands).includes(message.toString()) && canSendMessage) {
    const [ from ] = clients.filter(from => from.client === client_connected)

    clients
    .filter(to => to.client !== client_connected)
    .forEach(clientTo => {
      const date = new Date(Date.now())
      .toLocaleDateString('pt-BR', {hour: '2-digit', minute: '2-digit'})
      
      const messageToSend = `${date} ${from.user}: ${message}`
      
      clientTo.client.write('----------------------------------------------------\n')
      clientTo.client.write(messageToSend)
      clientTo.client.write('----------------------------------------------------\n')
        
      const history = {
        to_client: clientTo.user,
        from_client: from.user,
        message: message.toString(),
        date, 
      }
        
      write('messages_history.json', history)
    })
  }
}

const changeUserName = (userName, clientToChangeUserName) => {
  const indexClient = clients.findIndex(from => from.client === clientToChangeUserName)

  const oldUserName = clients[indexClient].user

  clients[indexClient].user = userName

  clients[indexClient].client.write('----------------------------------------------------\n')
  clients[indexClient].client.write(`User name changed to: ${userName}\n`)
  clients[indexClient].client.write('----------------------------------------------------\n')

  clients
    .filter(to => to.client !== clientToChangeUserName)
    .forEach(clientTo => {
      clientTo.client.write('----------------------------------------------------\n')
      clientTo.client.write(`${oldUserName} changed name to: ${clients[indexClient].user}\n`)
      clientTo.client.write('----------------------------------------------------\n')
  })

  const actionUser = {
    user: clientToChangeUserName.user,
    action: 'CHANGE_NAME',
    change: `user: ${clientToChangeUserName.user} changed to: ${userName}`
  }

  write('actions_user_history.json', actionUser)
}

server.on('connection', client => {
  const user = faker.name.firstName()

  console.log(`${user} connected!`)
  
  clients.push({user, client})

  emitMessageNewUserJoined(user, client)

  client.on('data', data => broadcast(data, client))
  
  client.on('end', () => {
    console.log(`${user} exited\n`)
    clients.splice(clients.indexOf(client), 1)
  })

  client.on('error', error => console.log('Error ocurred: \n', error))
})

server.listen(process.env.PORT, process.env.HOST, () => {
  console.log('Server started!', server.address())
})
