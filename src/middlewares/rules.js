const _ = require('lodash')

// Plugins and rules
const plugins = require('../plugins')

module.exports = (req, res, next) => {
  const schema = req.config

  // currently only exact match is supported
  const matchingCondition = _.find(schema, (r) => {
    return r.condition === 'Location' && r.args[0] === req.path
  })

  // no condition matches
  if(!matchingCondition)
    return next()

  let ruleMiddlewares = matchingCondition.rules
    .map(rule => ({ func: plugins.rules[rule.name], args: rule.args }))
    .filter( rule => rule.func )

  applyMiddlewares(ruleMiddlewares, req, res, next)
}

