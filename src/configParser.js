
const splitLines = text => text.split(/\r?\n/)

const INDENT_REGEX = /^\s+(.*)$/

// Check if line is indented
const hasIndent = (str) => {
  const match = str.match(INDENT_REGEX)
  return match && match.length > 1
}

/*
 * Splits line into a set of tokens
 */
const tokenize = line => {
  m = line.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g)

  if(!m) return []

  return m.filter(x => x)
    .map(s => s.replace( /^\"|\"$/g, '') )
}


/*
 * The function parses raw config data
 */
const configParser = configRaw => {
  let conditions = []

  let lines = splitLines(configRaw)
  let currentCondition = null

  for(let i = 0; i < lines.length; ++i ) {
    let line   = lines[i]
    let tokens = tokenize(line)

    if(!tokens.length) continue

    if( hasIndent(line) ) {
      if( !currentCondition ) continue

      let rule = {
        name: tokens[0],
        args: tokens.slice(1)
      }

      currentCondition.rules.push(rule)

    } else {
      if(currentCondition) conditions.push(currentCondition)

      currentCondition = {
        condition: tokens[0],
        args: tokens.slice(1),
        rules: [ ]
      }
    }
  }
  if(currentCondition) conditions.push(currentCondition)

  return conditions
}

module.exports = configParser

