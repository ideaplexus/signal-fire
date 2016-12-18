const Server = require('./lib/Server').Server
const UserPasswordSchema = require('./schemas/UserPasswordSchema').UserPasswordSchema
const AuthenticationFailedError = require('./errors/AuthenticationFailedError').AuthenticationFailedError
const debug = require('debug')('sf:example')

const server = new Server({
  port: 8080
})

server.authentication(new UserPasswordSchema({
  method: (user, password) => {
    if (user === 'Michiel' && password === 'abcde') {
      return Promise.resolve({
        id: 'id-mich',
        user: 'Michiel'
      })
    }

    return Promise.reject(new AuthenticationFailedError('invalid credentials'))
  }
}))

server.on('client', client => {
  debug(`got client with id ${client.id}`)
  client.once('close', () => {
    debug(`closed client with id ${client.id}`)
  })
})

server.start().then(() => {
  debug('server started')
})
