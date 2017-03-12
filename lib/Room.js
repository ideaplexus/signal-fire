const Client = require('./Client')
const Message = require('./Message')

class Room {
  constructor (name = null) {
    this._name = name
    this._clients = new Map()
  }

  get size () {
    return this._clients.size
  }

  add (client = null) {
    if (client === null || !(client instanceof Client)) {
      return Promise.reject(new TypeError('client must be an instance of Client'))
    }
    if (this._clients.has(client.id)) {
      return Promise.reject(new Error(`Client with ID ${client.id} already in room`))
    }
    this._clients.set(client.id, client)
    // TODO: Add event listeners
    return Promise.resolve()
  }

  remove (clientId = null) {
    if (!clientId || clientId === null) {
      return Promise.reject(new TypeError('Invalid client ID'))
    }
    if (!this._clients.has(clientId)) {
      return Promise.reject(new Error(`Client with ID ${clientId} not in room`))
    }
    // TODO: Remove event listeners
    this._clients.delete(clientId)
    return Promise.resolve()
  }

  _onMessage (msg = null) {
    if (!msg || msg === null || !(msg instanceof Message)) {
      return Promise.reject(new TypeError('msg must be an instance of Message'))
    }
    const excludeIds = msg.hasHeader('from') ? [ msg.getHeader('from') ] : []
    return this._broadcast(msg, excludeIds)
  }

  _broadcast (msg = null, excludeIds = []) {
    if (!msg || msg === null || !(msg instanceof Message)) {
      return Promise.reject(new TypeError('msg must be an instance of Message'))
    }
    const promises = []
    for (let client of this._clients.values()) {
      if (client.id in excludeIds) continue
      promises.push(client.send(msg))
    }
    return Promise.all(promises)
  }
}

exports = module.exports = Room
