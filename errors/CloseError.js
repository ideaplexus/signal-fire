class CloseError extends Error {
  constructor (message) {
    super(message)
    this.name = 'CloseError'
    this.close = true
  }
}

exports.CloseError = module.exports.CloseError = CloseError
