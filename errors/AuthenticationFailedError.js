const CloseError = require('./CloseError').CloseError

class AuthenticationFailedError extends CloseError {
  constructor (message) {
    super(message)
    this.name = 'AuthenticationFailedError'
    this.close = true
  }
}

exports.AuthenticationFailedError = module.exports.AuthenticationFailedError = AuthenticationFailedError
