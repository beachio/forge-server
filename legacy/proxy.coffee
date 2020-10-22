knox        = require 'knox'
config      = require('/var/deploy/config').config()
http        = require 'http'
rimraf      = require 'rimraf'
file_path   = require 'path'
fs          = require 'fs'
spawn       = require('child_process').spawn

filename404 = file_path.resolve(__dirname, '404.html')
error404    = fs.readFileSync(filename404)

s3 = knox.createClient
  key: config.key,
  secret: config.secret,
  bucket: "asgard-production"

server = http.createServer (req, res) ->
  
  address  = req.headers.host.split(":")[0]
  filename = req.url

  address = "www.riothq.com" if address == "localhost"

  filename = filename.split("?")[0] || "/index.html"

  if address.slice(0, 4) == "www."
    address = address.slice(4)

  if address == "getforge.io"
    res.writeHead 302, 'Location': 'http://getforge.com'
    return res.end()

  if filename == '/_asgard_health_check.html'
    return res.end()

  if filename == "/_asgard_cache_buster"
    rimraf "/tmp/cache/#{address}", () -> res.end()
    rimraf "/tmp/cache/www.#{address}", () -> res.end()
    spawn 'restart nginx', [], { stdio: 'inherit' } # I'm not sure this is a great idea.
    return res.end()

  if filename == "/"
    filename = "/index.html"
  else if filename.slice(-1) == "/"
    filename += "index.html"
  else if filename.slice(-4) in ['.gif', '.mpg', '.jpg', '.css', '.ico', '.css', '.png', '.mov'] or filename.slice(-3) in ['.js']
    try
      text = fs.readFileSync "/tmp/cache/#{address}/index", 'utf8'
      token = text.match(/forge-token:(.*[0-9])/)[1]
      res.writeHead(302,
        'Location': "http://asgard-production.s3.amazonaws.com/#{address}/#{token}#{filename}"
      )
      res.end()

    catch e
      res.end()
  else if filename.slice(-5) != ".html" && filename.slice(-4) != '.ico' && filename.slice(-4) != ".htm"
    filename += ".html"

  path = address + filename

  serveFilePathWithFallback = (path, errorCallback) ->
    s3.get(path).on('response', (res_from_s3) ->
      if res_from_s3.statusCode == 200

        statusCode = res_from_s3.statusCode
        statusCode = 404 if path.slice(10) == "/404.html"

        res.writeHead statusCode, 'content-type': res_from_s3.headers['content-type']
        res_from_s3.on 'data', (chunk) -> res.write(chunk)
        res_from_s3.on 'end', -> return res.end()
      else
        errorCallback()
    ).end()

  serveFilePathWithFallback path, ->
    # Error, so show a custom 404 page
    serveFilePathWithFallback "#{address}/404.html", ->
      # If they don't have a 404 page, show something else!
      res.writeHead 404, 'content-type': 'text/html'
      res.write(error404)
      res.end()

server.listen(config.port)