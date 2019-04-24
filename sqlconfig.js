'use strict'

const config = {
  host     : '127.0.0.1',
  user     : 'root',
  password : 'easypass',
  database : 'dk205_AfN19'
}

if (process.env.NODE_ENV === 'prod') {
  config.socketPath = '/cloudsql/silicon-synapse-232018:europe-north1:dikult205'
}

module.exports = config
