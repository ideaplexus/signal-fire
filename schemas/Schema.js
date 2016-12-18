class Schema {
  authenticate () {
    throw new Error('inherit from Schema')
  }
}

exports.Schema = module.exports.Schema = Schema
