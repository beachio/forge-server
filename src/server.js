const express     = require('express')

const { config }  = require('./env')
const logger      = require('./logger')

let app = express()

app.use(require('./middlewares/common'))
app.use(require('./middlewares/rules'))
app.use(require('./middlewares/static'))
app.use(require('./middlewares/notFound'))

app.listen(config.port, function () {
  logger(`🚀  Proxy running on 0.0.0.0:${config.port}`)
})
