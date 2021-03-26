const s3     = require('../s3').client
const logger = require('../logger')

const path   = require('path')

const { config } = require('../env')
const zlib = require('zlib');
/*
 * Whether or not file is static asset
 */
const isAsset = (url) => {
  const knownExts = ['.gif', '.mpg', '.jpg', '.css', '.ico', '.css', '.png', '.mov', '.js', '.jpeg']
  return knownExts.indexOf(path.extname(url)) != -1
}

const isFiles = (rules) => {
  for(let i = 0; i < rules.length; i++ ) {
    if (rules[i].condition != 'Files')
      continue
    return rules[i].rules.map(function(rule){
      if (rule.name[0] != '/')
        rule.name = '/' + rule.name
      return rule.name
    })
  }
}

const inWildcardPath = (rules, filename) => {
  include = false;
    for(let i = 0; i < rules.length; i++ ) {
        if (rules[i].condition != 'Files')
            continue
        file_rules = rules[i].rules;
        for(let j = 0; j < file_rules.length; j++){
          if (file_rules[j].name.slice(-1) == '*') {
            wildcard_rule_path = '';
            wildcard_rule_path = file_rules[j].name.substring(0, file_rules[j].name.length - 1);
            if (wildcard_rule_path[0] != '/')
              wildcard_rule_path = '/' + wildcard_rule_path;
            include = filename.includes(wildcard_rule_path);
            if (include)
              break;
          }
        }
        if (include)
          break;
    }
    return include;
}

const middleware = (req, res, next) => {
  let filename = decodeURI(req.context.path);
  filesInConfig = isFiles(req.context.config)

  if(typeof filesInConfig == 'undefined')
    filesInConfig = []
  if(filename.slice(-1) == '/') {
    filename += 'index.html'
  }

  /*
   * Static assets are served through redirect to S3
   */
  if(isAsset(filename) && filesInConfig.indexOf(filename) == -1) {
    const token = req.context.token
    if(!token) return res.end()

    // TODO: the url should be formed inside s3.js module!
    const location = `https://${config.bucket}.s3.amazonaws.com/${req.context.address}/${token}${filename}`

    res.writeHead(302, { 'Location': location })

    logger(`↪️  ${filename} is asset, redirecting to ${location}`)
    return res.end()
  }


  /*
   * For pages only! Serving them directly
   */
  if (filesInConfig.indexOf(filename) != -1 || inWildcardPath(req.context.config, filename)){
    const token = req.context.token
    if(!token) return res.end()
    filepath = `${req.context.address}/${token}${filename}`
  } else{
    filepath = `${req.context.address}${filename}`
  }
  logger(`📥  Serving file from S3 ${filepath}`)

  s3.get(filepath).on('response', (response) => {
    console.log(response.statusCode);
    console.log(response.body);
    if (response.statusCode !== 200) {
      return next()
    }

    statusCode = req.context.overwriteStatus || response.statusCode

    res.writeHead(statusCode, {
      'content-type': response.headers['content-type']
    })

    response.on('data', chunk =>  {
      if (response.headers['content-encoding'] == 'gzip')
      {
        var text;
        text =zlib.unzipSync(chunk, (err, chunk) => {
          return chunk.toString()
        });
        res.write(text);
      }
      else
      {
        res.write(chunk)
      }
    });

    response.on('end', ()     => res.end())
  }).end()
}

module.exports = middleware

module.exports.performRewrite = (req, res, next, path, status) => {
  req.context.path            = path
  req.context.overwriteStatus = status

  middleware(req, res, next)
}
