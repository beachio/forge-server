rimraf = require('rimraf')
http = require('http')
https = require('https')

fetch = ->
  https.request(
    {
      host: 'getforge.com',
      path: '/deployed.json'
    }, 
    (response) ->
      str = ""
      response.on 'data', (chunk) -> str += chunk
      response.on 'end', ->
        if response.statusCode == 200
          domains = JSON.parse(str)
          for domain in domains
            rimraf "/tmp/cache/#{domain}", =>  # 
            rimraf "/tmp/cache/www.#{domain}", =>  # 
  ).end()

fetch()
setInterval fetch, 2000