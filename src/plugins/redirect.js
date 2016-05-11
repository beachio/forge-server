let api = require('./index')

api.registerRule('Redirect', (args, req, res, next) => {
  const location = args[0]
  const status   = Number(args[1]) || 302

  return res.redirect(status, location)
})
