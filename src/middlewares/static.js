const s3     = require('../s3').client
const logger = require('../logger')

const path   = require('path')

/*
 * Whether or not file is static asset
 */
const isAsset = (url) => {
  const knownExts = ['.gif', '.mpg', '.jpg', '.css', '.ico', '.css', '.png', '.mov', '.js']
  return knownExts.indexOf(path.extname(url)) != -1
}

const middleware = (req, res, next) => {
  let filename = req.context.path

  if(filename.slice(-1) == '/') {
    filename += 'index.html'
  }

  /*
   * Static assets are served through redirect to S3
   */
  if(isAsset(filename)) {
    const token = req.context.token
    if(!token) return res.end()

    // TODO: the url should be formed inside s3.js module!
    const location = `http://asgard-production.s3.amazonaws.com/${req.context.address}/${token}${filename}`

    res.writeHead(302, { 'Location': location })

    logger(`↪️  ${filename} is asset, redirecting to ${location}`)
    return res.end()
  }


  /*
   * For pages only! Serving them directly
   */
  const filepath = `${req.context.address}${filename}`
  logger(`📥  Serving file from S3 ${filepath}`)

  s3.get(filepath).on('response', (response) => {
    if (response.statusCode !== 200) {
      return next()
    }

    statusCode = req.context.overwriteStatus || response.statusCode

    res.writeHead(statusCode, {
      'content-type': response.headers['content-type']
    })

    response.on('data', chunk => res.write(chunk))
    response.on('end', ()     => res.end())
  }).end()
}

module.exports = middleware

module.exports.performRewrite = (req, res, next, path, status) => {
  req.context.path            = path
  req.context.overwriteStatus = status

  middleware(req, res, next)
}
