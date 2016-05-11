const { config }  = require('./env')
const express     = require('express')

let app = express()

app.use(require('./middlewares/common'))
app.use((req, res, next) => {
  console.log(`⚓️  ${req.context.address} ${req.context.path}`)
  next()
})
app.use(require('./middlewares/rules'))
app.use(require('./middlewares/static'))
app.use(require('./middlewares/notFound'))

app.listen(config.port, function () {
  console.log('🚀  Proxy running...');
})
