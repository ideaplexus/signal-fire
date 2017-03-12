const EventEmitter = require('events').EventEmitter

const Message = require('./Message')

class Client extends EventEmitter {
  constructor (id = null, socket = null) {
    super()
    this._id = id
    this._socket = socket
    this._rooms = new Map()
  }

  get id () {
    return this._id
  }

  send (msg) {
    return new Promise((resolve, reject) => {
      if (!msg || msg === null || !(msg instanceof Message)) {
        return reject(new TypeError('msg must be an instance of Message'))
      }
      if (this._socket.readyState !== 1) {
        return reject(new Error('Client not ready'))
      }
      this._socket.send(msg.toString(), () => {
        resolve()
      })
    })
  }

  _onMessage (msg) {
    if (!msg || msg === null || !(msg instanceof Message)) {
      return Promise.reject(new TypeError('msg must be an instance of Message'))
    }
    if (msg.hasHeader('room')) {
      const roomName = msg.getHeader('room')
      if (this._rooms.has(roomName)) {
        return this._rooms.get(roomName).onMessage(msg)
      } else {
        return Promise.reject(new Error(`Client not added to room ${roomName}`))
      }
    }
  }
}

exports = module.exports = Client
