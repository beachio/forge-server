
/*
 * Utility module that helps plugins to register themselves
 */

let rules = {}

exports.registerRule = (ruleName, func) => rules[ruleName] = func
exports.rules = rules


// Simply require all modules in current folder
const fs = require('fs')
const path = require('path')

fs
  .readdirSync(path.resolve(__dirname))
  .forEach( file => file === 'index.js' ? null: require(`./${file}`) )

