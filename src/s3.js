//const { config } = require('./env')
const knox       = require('knox')

const s3 = knox.createClient({
  key:    'dfdsf',//config.key,
  secret: 'fdgdfg',//config.secret,
  bucket: 'dgdgd',//config.bucket,
  region: 'fgggg'//config.region
})

exports.client = s3

/*
 * Loads file content from S3
 * returns null when no file is found
 */
const streamBuffers = require('stream-buffers')

exports.getFileContent = (filepath, cb) => {
  s3.get(filepath)
  .on('response', (response) => {
    if(response.statusCode != 200)
      return cb(null, null)

    let buffer = new streamBuffers.WritableStreamBuffer
    response.pipe(buffer)

    response.on('end', () => {
      let content = buffer.getContentsAsString('utf8')
      cb(null, content)
    })

  }).end()
}
