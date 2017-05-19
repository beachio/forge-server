const _ = require('lodash')
const pathToRegexp = require('path-to-regexp')

// Plugins and rules
const plugins = require('../plugins')
const { applyMiddlewares } = require('../utils')

module.exports = (req, res, next) => {
  const schema = req.context.config

  const matchingCondition = _.find(schema, (r) => {
    if(r.condition !== 'Location')
      return false

    // The match is performed using same rules
    // that express.js uses for defining routes
    let keys = []

    const path  = r.args[0] || ''
    const match = pathToRegexp(path, keys).exec(req.context.path)

    if(!match) return false

    for (let i = 1; i < match.length; i++) {
      req.context.vars[ keys[i-1].name ] = match[i]
    }

    return true
  })

  // no condition matches
  if(!matchingCondition)
    return next()

    if(matchingCondition.rules[0].name === 'ClearLastSlash')
      matchingCondition.rules[0].args[1] = req.context.path
  let ruleMiddlewares = matchingCondition.rules
    .map(rule => ({ func: plugins.rules[rule.name], args: rule.args }))
    .filter( rule => rule.func )

  applyMiddlewares(ruleMiddlewares, req, res, next)
}

