const EventEmitter = require('events').EventEmitter
const shortid = require('shortid')
const updatedJSON = require('json-updated')
const debug = require('debug')('sf:Client')

const AuthenticationFailedError = require('../errors/AuthenticationFailedError').AuthenticationFailedError

const DEFAULT_OPTIONS = {
  generate_id: shortid.generate,
  authenticationTimeout: 5000,
  authentication: null
}

const PEER_MESSAGE_TYPES = [
  'offer',
  'answer',
  'ice'
]

class Client extends EventEmitter {
  constructor (server = null, socket = null, options = {}) {
    super()

    this._id = null
    this._open = true
    this._server = server
    this._socket = socket
    this._credentials = null
    this._messageTypes = new EventEmitter()
    this._options = Object.assign({}, DEFAULT_OPTIONS, options)

    if (this.authenticationEnabled && this._options.authenticationTimeout > 0) {
      setTimeout(() => {
        if (this.open && !this.isAuthenticated) {
          this.send({
            type: 'auth_fail',
            message: 'authentication timed out'
          }).then(() => this.close())
        }
      }, this._options.authenticationTimeout)
    } else {
      this._id = this._options.generate_id()
      this.send({
        type: 'auth_ok',
        id: this._id
      })
      process.nextTick(() => {
        this.emit('id', this._id)
      })
    }

    this._addSocketListeners()
  }

  get id () {
    return this._id
  }

  get open () {
    return this._open && this._socket !== null
  }

  get authenticationEnabled () {
    return this._options.authentication !== null
  }

  get isAuthenticated () {
    return this._credentials !== null
  }

  get credentials () {
    return this._credentials
  }

  get messageTypes () {
    return this._messageTypes
  }

  send (msg) {
    return updatedJSON.stringify(msg).then(json => {
      return new Promise((resolve, reject) => {
        if (!this.open) return reject(new Error('underlying socket not open'))
        this._socket.send(json, () => {
          resolve()
        })
      })
    })
  }

  close () {
    if (!this.open) return Promise.reject(new Error('underlying socket not open'))
    this._socket.close()
    return Promise.resolve()
  }

  relay (msg) {
    if (this._id !== msg.receiver) return Promise.reject(new Error('not the receiver'))
    if (PEER_MESSAGE_TYPES.indexOf(msg.type) === -1) return Promise.reject(new Error('invalid message type'))
    return this.send(msg)
  }

  _addSocketListeners () {
    const onMessage = (data, flags) => {
      if (this.authenticationEnabled && !this.isAuthenticated) {
        this._onSocketAuthentication(data, flags)
      } else {
        this._onSocketMessage(data, flags)
      }
    }

    const onError = err => {
      this._onSocketError(err)
    }

    const onClose = (code, message) => {
      this._socket.removeListener('message', onMessage)
      this._socket.removeListener('error', onError)
      this._open = false
      this._socket = null
      this._credentials = null
      this.emit('close', code, message)
    }

    this._socket.on('error', onError)
    this._socket.once('close', onClose)
    this._socket.on('message', onMessage)
  }

  _onSocketAuthentication (data, flags) {
    this._decodeMessage(data, flags).then(msg => {
      if (msg.type !== 'auth') return Promise.reject(new AuthenticationFailedError('invalid message type'))
      return this._options.authentication.authenticate(msg)
    }).then(credentials => {
      this._credentials = credentials
      this._id = this._credentials.id || this._options.generate_id()
      this.emit('id', this._id)
      return this.send({
        type: 'auth_ok',
        id: this._id,
        credentials: credentials
      })
    }).catch(err => {
      this.send({
        type: 'auth_fail',
        message: err.message || err
      }).then(() => {
        this.close()
      })
    })
  }

  _onSocketMessage (data, flags) {
    this._decodeMessage(data, flags).then(msg => {
      if (PEER_MESSAGE_TYPES.indexOf(msg.type) !== -1) {
        // Relay the message, it's meant for another peer
        return this._relayMessage(msg)
      } else if (this._messageTypes.eventNames().indexOf(msg.type) !== -1) {
        // It's a custom message type
        return this._messageTypes.emit(msg.type, msg)
      } else {
        // It's an unknown message type
        return Promise.reject(new Error('unknown message type'))
      }
    }).catch(err => {
      this.send({
        type: 'err',
        message: err.message || err
      }).then(() => {
        if (err.close) this.close()
      })
    })
  }

  _relayMessage (msg) {
    if (!('receiver' in msg)) return Promise.reject(new Error('missing receiver'))
    if (!this._server._clients.has(msg.receiver)) return Promise.reject(new Error('unknown receiver'))

    // Add the ID of the sender
    msg.sender = this._id
    delete msg.receiver
    return this._server.clients.get(msg.receiver).relay(msg)
  }

  _decodeMessage (data, flags) {
    return updatedJSON.parse(data).then(json => {
      if (!('type' in json)) return Promise.reject(new Error('missing parameters'))
      return Promise.resolve(json)
    })
  }
}

exports.Client = module.exports.Client = Client
