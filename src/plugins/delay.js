let api = require('./index')

api.registerRule('Delay', (args, req, res, next) => {
  const timeout = Number(args[0]) || 0
  setTimeout(next, timeout)
})
