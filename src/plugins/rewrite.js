let api = require('./index')

const { performRewrite } = require('../middlewares/s3Middleware')

api.registerRule('Rewrite', (args, req, res, next) => {
  const location = args[0]
  let status     = args[1]

  if(status) status = parseInt(status)

  return performRewrite(req, res, next, location, status)
})
