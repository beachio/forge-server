var pkg = require('./package.json');
var envmnt = require('./secrets.json');

module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            workspace: '/tmp/forge-server-workspace',
            deployTo: '/home/ec2-user/deploy/forge-server',
            repositoryUrl: envmnt.repository.url,
            ignores: ['.git', 'node_modules'],
            keepReleases: 2,
            deleteOnRollback: false,
            key: envmnt.production.key_path
        },
        production: {
            servers: envmnt.production.user + '@' + envmnt.production.host
        }
    });

    shipit.task('start', function () {
        shipit.remote('sudo restart node');
        shipit.remote('sudo restart forge-server');
        shipit.remote('sudo restart forge-server-deleter');
    });

    shipit.on('updated', function () {
        shipit.start('start');
    });
};