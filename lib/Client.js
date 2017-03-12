const EventEmitter = require('events').EventEmitter

const Message = require('./Message')

class Client extends EventEmitter {
  constructor (id = null, socket = null) {
    super()
    this._id = id
    this._socket = socket
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
}

exports = module.exports = Client
