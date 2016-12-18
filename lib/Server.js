const EventEmitter = require('events').EventEmitter
const debug = require('debug')('sf:Server')

const shortid = require('shortid')
const Client = require('./Client').Client
const Schema = require('../schemas/Schema').Schema

const DEFAULT_OPTIONS = {
  server: require('ws').Server,
  port: process.env.PORT || 0
}

class Server extends EventEmitter {
  constructor (options = {}, id = shortid.generate()) {
    super()

    this._id = id
    this._open = false
    this._socket = null
    this._clients = new Map()
    this._authentication = null
    this._options = Object.assign({}, DEFAULT_OPTIONS, options)

    // Check port range
    if (this._options.port <= 0 || this._options.port > 65535) {
      throw new TypeError(`invalid port number (${this._options.port})`)
    }
  }

  get open () {
    return this._open && this._socket !== null
  }

  authentication (schema = null) {
    if (this.open) return Promise.reject(new Error('underlying socket already open'))
    if (schema === null || !(schema instanceof Schema)) return Promise.reject(new TypeError('schema must be an instance of Schema'))
    this._authentication = schema
    return Promise.resolve()
  }

  start () {
    return new Promise((resolve, reject) => {
      if (this.open) return reject(new Error('underlying socket already open'))

      const WebSocketServer = this._options.server
      this._socket = new WebSocketServer(this._options)
      this._addSocketListeners()
      resolve()
    })
  }

  _addSocketListeners () {
    const onConnection = socket => {
      this._onSocketConnection(socket)
    }

    const onError = err => {
      this._onSocketError(err)
    }

    this._socket.on('error', onError)
    this._socket.on('connection', onConnection)
    this.once('close', () => {
      this._socket.removeListener('error', onError)
      this._socket.removeListener('connection', onConnection)
      this._open = false
      this._socket = null
    })
  }

  _onSocketConnection (socket) {
    const client = new Client(this, socket, {
      authentication: this._authentication
    })

    client.once('id', id => {
      debug(`id for client ${client.id}`)
      if (!this._clients.has(id)) {
        this._clients.set(id, client)
        this.emit('client', client)
      }
    })

    client.once('close', () => {
      debug(`close client ${client.id}`)
      if (this._clients.has(client.id)) {
        this._clients.delete(client.id)
      }
    })
  }

  _onSocketError (err) {
    debug(`socket error: ${err.message}`)
  }
}

exports.Server = module.exports.Server = Server
