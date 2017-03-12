const Client = require('./Client')
const Message = require('./Message')

/**
 * Class representing a Room object.
 * @type {Class}
 */
class Room {
  constructor (name = null) {
    this._name = name
    this._clients = new Map()
  }

  /**
   * Gets the number of client in the room.
   */
  get size () {
    return this._clients.size
  }

  /**
   * Adds a new client to the room.
   * @param {Object} [client=null] The client to add
   */
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

  /**
   * Removes a client from the room.
   * @param {String} [clientId=null] ID of the client to remove
  */
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

  /**
   * Handles incoming messages for this room.
   * @param {Message} [msg=null] The message that was received
   */
  onMessage (msg = null) {
    if (!msg || msg === null || !(msg instanceof Message)) {
      return Promise.reject(new TypeError('msg must be an instance of Message'))
    }
    const excludeIds = msg.hasHeader('from') ? [ msg.getHeader('from') ] : []
    return this._broadcast(msg, excludeIds)
  }

  /**
   * Broadcasts a message to all clients in this room. Clients can be excluded
   * by suppliying an array of client IDs as the second argument.
   * @param {Message}  [msg=null]      The message to broadcast
   * @param {Array}    [excludeIds=[]] Array of client IDs to exclude
   * @return {Promise} Resolves if the broadcast was successful
   */
  broadcast (msg = null, excludeIds = []) {
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
