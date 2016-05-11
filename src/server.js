const config  = require('./env')
const _       = require('lodash')
const express = require('express')

const parser = require('./configParser')

// middlewares
const commonMiddleware   = require('./middlewares/commonMiddleware')
const staticMiddleware   = require('./middlewares/staticMiddleware')
const s3middleware       = require('./middlewares/s3middleware')
const notFoundMiddleware = require('./middlewares/notFoundMiddleware')


// Plugins and rules
const plugins = require('./plugins')
const pluginRules = plugins.rules

let app = express()


/*
 * This function applies middlewares in chain
 */
const applyMiddlewares = (middlewares, req, res, next) => {
  let mddlw = middlewares.slice()

  function appl(err) {
    // In case of error do not call middleware
    // just break the chain
    if(err) return next(err)

    if( mddlw.length > 0 ) {
      let currentMiddleware = mddlw[0]
      mddlw = mddlw.slice(1)

      currentMiddleware.func(currentMiddleware.args, req, res, appl)
    } else { next(err) }
  }
  return appl()
}


const rulesMiddleware = (req, res, next) => {
  const schema = req.config

  // currently only exact match is supported
  const matchingCondition = _.find(schema, (r) => {
    return r.condition === 'Location' && r.args[0] === req.path
  })

  // no condition matches
  if(!matchingCondition)
    return next()

  let ruleMiddlewares = matchingCondition.rules
    .map(rule => ({ func: pluginRules[rule.name], args: rule.args }))
    .filter( rule => rule.func )

  applyMiddlewares(ruleMiddlewares, req, res, next)
}


app.use( (req, res, next) => {
  const configRaw = `
Location /about
  Respond help
  Delay 2000
  Respond "Sorry this page is still under construction" 200

Location /pricing
  Redirect / 302
`
  const schema = parser( configRaw )
  req.config = schema
  next()
})


app.use(commonMiddleware)
app.use(rulesMiddleware)
app.use(s3middleware)
app.use(notFoundMiddleware)


app.listen(config.port, function () {
  console.log('🚀  Proxy running...');
})
