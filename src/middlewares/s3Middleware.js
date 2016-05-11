const config = require('../env')
const knox   = require('knox')

const s3 = knox.createClient({
  key:    config.key,
  secret: config.secret,
  bucket: config.bucket,
  region: config.region
})

const middleware = (req, res, next) => {
  const forge = req.forge

  let filename = forge.path

  if(filename.slice(-1) == '/') {
    filename += 'index.html'
  }

  // TODO: check ext and serve assets

  // else if filename.slice(-4) in ['.gif', '.mpg', '.jpg', '.css', '.ico', '.css', '.png', '.mov'] or filename.slice(-3) in ['.js']
  //   try
  //     text = fs.readFileSync "/tmp/cache/#{address}/index", 'utf8'
  //     token = text.match(/forge-token:(.*[0-9])/)[1]
  //     res.writeHead(302,
  //       'Location': "http://asgard-production.s3.amazonaws.com/#{address}/#{token}#{filename}"
  //     )
  //     res.end()

  //   catch e
  //     res.end()
  // else if filename.slice(-5) != ".html" && filename.slice(-4) != '.ico' && filename.slice(-4) != ".htm"
  //   filename += ".html"

  // path = address + filename

  const filepath = `${forge.address}${filename}`


  // For pages only! Serving them directly
  s3.get(filepath).on('response', (response) => {
    if (response.statusCode !== 200) {
      return next()
    }

    statusCode = req.forge.overwriteStatus || response.statusCode

    res.writeHead(statusCode, {
      'content-type': response.headers['content-type']
    })

    response.on('data', chunk => res.write(chunk))
    response.on('end', ()     => res.end())
  }).end()
}

module.exports = middleware

module.exports.performRewrite = (req, res, next, path, status) => {
  req.forge.path = path
  req.forge.overwriteStatus = status

  middleware(req, res, next)
}
