exports.config = function() {
  return {
    key:    process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_BUCKET,
    region: process.env.REGION,
    forge_api: process.env.FORGE_API,
    port:   process.env.PORT
  };
}
