const path = require('path')
const fs   = require('fs')

const { performRewrite } = require('./static')

errorPageContent = fs.readFileSync(path.resolve(__dirname, '../assets/404.html'))


const _                    = require('lodash')
const plugins              = require('../plugins')
const { applyMiddlewares } = require('../utils')

const tryNotFoundRules = (req, res, next) => {
  const schema = req.context.config

  const matchingCondition = _.find(schema,
    r => r.condition === 'NotFound')

  // no condition matches
  if(!matchingCondition)
    return next()

  let ruleMiddlewares = matchingCondition.rules
    .map(rule => ({ func: plugins.rules[rule.name], args: rule.args }))
    .filter( rule => rule.func )

  applyMiddlewares(ruleMiddlewares, req, res, next)
}


/*
 * This middleware tries to serve custom 404.html page
 * with fallback to default one
 */
module.exports = (req, res, next) => {
  tryNotFoundRules(req, res, () => {
    performRewrite(req, res, () => {

      res
        .set({ 'Content-Type': 'text/html' })
        .send(errorPageContent)

    }, '/404.html', 404)
  })
}
