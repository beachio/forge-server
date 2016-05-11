const api = require('./index')

api.registerRule('Respond', (args, req, res, next) => {
  const textToRespond = args[0] || ''
  const status        = args[1] || 200

  return res.status(status)
    .send(textToRespond)
    .end()
})
