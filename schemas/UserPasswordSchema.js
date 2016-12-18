const Schema = require('./Schema').Schema

const AuthenticationFailedError = require('../errors/AuthenticationFailedError').AuthenticationFailedError

const DEFAULT_OPTIONS = {
  fields: {
    username: 'user',
    password: 'password'
  },
  method: () => {
    return Promise.reject(new Error('implement your own method'))
  }
}

class UserPasswordSchema extends Schema {
  constructor (options = {}) {
    super()
    this._options = Object.assign({}, DEFAULT_OPTIONS, options)
  }

  authenticate (msg) {
    const user = msg[this._options.fields.username] || null
    const password = msg[this._options.fields.password] || null

    if (user === null || password === null) {
      return Promise.reject(new AuthenticationFailedError('missing fields'))
    }

    return this._options.method(user, password)
  }
}

exports.UserPasswordSchema = module.exports.UserPasswordSchema = UserPasswordSchema
