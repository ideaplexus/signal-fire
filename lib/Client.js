const EventEmitter = require('events').EventEmitter
const shortid = require('shortid')
const updatedJSON = require('json-updated')
const debug = require('debug')('sf:Client')

const AuthenticationFailedError = require('../errors/AuthenticationFailedError').AuthenticationFailedError

const DEFAULT_OPTIONS = {
  generate_id: shortid.generate,
  timeout: 5000,
  authentication: null
}

class Client extends EventEmitter {
  constructor (server = null, socket = null, options = {}) {
    super()

    this._id = null
    this._open = true
    this._server = server
    this._socket = socket
    this._credentials = null
    this._options = Object.assign({}, DEFAULT_OPTIONS, options)

    if (this.authenticationEnabled) {
      setTimeout(() => {
        if (this.open && !this.isAuthenticated) {
          this.send({
            type: 'auth_fail',
            message: 'authentication timed out'
          }).then(() => this.close())
        }
      }, this._options.timeout || 5000)
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
        if (err.close) this.close()
      })
    })
  }

  _onSocketMessage (data, flags) {
    this._decodeMessage(data, flags).then(msg => {
      //
    }).catch(err => {
      this.send({
        type: 'err',
        message: err.message || err
      }).then(() => {
        if (err.close) this.close()
      })
    })
  }

  _decodeMessage (data, flags) {
    return updatedJSON.parse(data).then(json => {
      if (!json.type) return Promise.reject(new Error('missing parameters'))
      return Promise.resolve(json)
    })
  }
}

exports.Client = module.exports.Client = Client
