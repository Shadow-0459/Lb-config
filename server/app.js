/*global require, process, console*/
'use strict';

var express = require('express');
var path = require('path');
var fs = require('fs');
var pkg = require('../package');
var appPath = '/labs/' + pkg.name + '/';
var port = process.env.PORT || 9000;
var ip = process.env.IP || 'localhost';
var publicDir = 'client';
var app = express();
var server = require('http').createServer(app);

var env = process.env.NODE_ENV || 'development';
if ('production' === env) {
    publicDir = 'public';
    ip = process.env.OPENSHIFT_LABSNODEJS_IP || ip;
    port = process.env.OPENSHIFT_LABSNODEJS_PORT || port;
    if (!process.env.OPENSHIFT_LABSNODEJS_IP) {
        publicDir = 'dist/public';
    }
} else {
    app.use(appPath, express.static(path.resolve('.tmp')));
}

app.use(appPath, express.static(path.resolve(publicDir)));

app.get('/', function(req, res) {
    res.send(200);
});

app.get(appPath + '*', function (req, res) {
    res.sendfile(path.resolve(publicDir + '/index.html'));
});

// route to serve /labs_key.txt
app.get('/labs_key.txt', function(req, res) {
    res.sendfile(path.resolve(publicDir + '/labs_key.txt'));
});

// Start server
server.listen(port, ip, function () {
    console.log('Express server listening on %d, in %s mode', port, app.get('env'));
});
