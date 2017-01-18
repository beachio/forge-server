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


    shipit.task('copy', function () {
        shipit.remote('cp /home/ec2-user/deploy/forge-server/current/legacy/proxy.js /home/ec2-user/proxy.js');
    });

    shipit.task('restart', function () {
        shipit.remote('sudo restart node');
        shipit.remote('sudo restart forge-server');
        shipit.remote('sudo restart forge-server-deleter');
    });

    // copy and replace new proxy.js
    shipit.on('published', function () {
        shipit.start('copy');
    });

    // restart all processes after deploy
    shipit.on('deployed', function () {
        shipit.start('restart');
    });

    // restart all processes after rollback
    shipit.on('rollbacked', function () {
        shipit.start('restart');
    });
};