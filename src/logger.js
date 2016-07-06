const moment = require('moment')

module.exports = (...args) => {
  console.log(`🕐  ${moment().format('MM.DD.YYYY HH:mm:ss')} #`, ...args)
}
