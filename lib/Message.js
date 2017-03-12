/**
 * Represents a Message class.
 * @type {Class}
 */
class Message {
  /**
   * Constructs a new Message object with the given optional headers and payload.
   * @param {Object} [headers={}]   Message headers (optional)
   * @param {Object} [payload=null] Message payload (optional)
   */
  constructor (headers = {}, payload = null) {
    this._headers = headers
    this._payload = payload
  }

  /**
   * Gets the value of the header with the given key, null if the key doesn't exist.
   * @param {String} key The header key
   * @return {String} The header value, or null
   */
  getHeader (key) {
    return this._headers[key] || null
  }

  /**
   * Get all headers.
   * @return {Object} The header object
   */
  getHeaders () {
    return this._headers
  }

  /**
   * Check if a header with the given key exists.
   * @param {String} key The header key
   * @return {Boolean} True if the key exists, false otherwise
   */
  hasHeader (key) {
    return key in this._headers
  }

  /**
   * Sets a single header on the message.
   * @param {String} key  The header key (name)
   * @param {Mixed} value The header value
   */
  setHeader (key, value) {
    this._headers[key] = value
  }

  /**
   * Sets multiple headers on the message.
   * @param {Object} [headers={}] Object with headers to set
   */
  setHeaders (headers = {}) {
    this._headers = Object.assign({}, this._headers, headers)
  }

  /**
   * Gets the message payload.
   * @return {Object} The message payload
   */
  getPayload () {
    return this._payload
  }

  /**
   * Sets the payload on the message.
   * @param {Object} [payload=null] The message payload
   */
  setPayload (payload = null) {
    this._payload = payload
  }

  /**
   * Converts the message to JSON.
   * @return {Object} The message in JSON
   */
  toJSON () {
    return {
      headers: this._headers,
      payload: this._payload
    }
  }

  /**
   * Converts the message into a string.
   * @return {String} The message as a string
   */
  toString () {
    return JSON.stringify(this.toJSON())
  }
}

exports = module.exports = Message
