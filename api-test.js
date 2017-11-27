const request = require('request')
const prms = require('./promisified.js')
const jsonfile = require('jsonfile')

prms.apiReq('https://etherchain.org/api/statistics/price', {})
  .then(res => jsonfile.writeFileSync('./eth-usd.json', res.data, {spaces: 2}))