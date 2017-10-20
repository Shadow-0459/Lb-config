/*global angular, document, atob, btoa*/

angular.module('lbconfigApp').factory('UtilityService', function ($document, CONSTANT) {
    'use strict';
    var utility = {};
    utility.apacheVersions = [
        {label: '2.2.x (EWS 1.x, EWS 2.x, RHEL 5, RHEL 6)', value: '22x'},
        {label: '2.4.x (JWS 3.x)', value: '24x'}
    ];
    utility.apacheMPMTypes = [
        CONSTANT.APACHE_MPM_TYPES.PREFORK,
        CONSTANT.APACHE_MPM_TYPES.WORKER,
        CONSTANT.APACHE_MPM_TYPES.WINNT,
        CONSTANT.APACHE_MPM_TYPES.EVENT
    ];
    utility.apacheModuleTypes = [
        CONSTANT.APACHE_MODULES.MOD_JK,
        CONSTANT.APACHE_MODULES.MOD_PROXY,
        CONSTANT.APACHE_MODULES.MOD_CLUSTER
    ];
    utility.apacheDiscoveryTypes = [
        {label: 'multicast advertise (default)', value: 'mcast'},
        {label: 'proxyList / multicast disabled', value: 'proxy'}
    ];
    utility.beckendVersions = [
        {label: 'Red Hat JBoss EAP 7.X', value: 7},
        {label: 'Red Hat JBoss EAP 6.X', value: 6},
        {label: 'Red Hat JBoss EAP 5.X', value: 5},
        {label: 'Red Hat JBoss EAP 4.3', value: 4},
        {label: 'Apache Tomcat', value: 'tc'}
    ];
    utility.scrollToElementById = function (id) {
        var someElement = angular.element(document.getElementById(id));
        $document.scrollToElementAnimated(someElement);
    };
    utility.scrollToElementByName = function (name) {
        var someElement = angular.element(document.getElementsByName(name)[0]);
        $document.scrollToElementAnimated(someElement, 100);
    };
    utility.updateConfig = function (config, params) {
        var temp = params.split(','), i = 0, keys = Object.keys(config);
        if (temp.length === 14) {
            for (i = 0; i < temp.length; i = i + 1) {
                if (temp[i] === 'true') {
                    // 'true' => true
                    config[keys[i]] = true;
                } else if (temp[i] === 'false') {
                    // 'false' => false
                    config[keys[i]] = false;
                } else if (isFinite(temp[i])) {
                    // '123' => 123
                    var number = parseInt(temp[i], 10);
                    if (!isNaN(number)) {
                        config[keys[i]] = number;
                    }
                } else {
                    config[keys[i]] = temp[i];
                }
            }
        } else {
            throw new Error('Parameters: ' + params + '. The count of parameters is ' + temp.length + '. The count of parameters must be 14.');
        }
    };
    utility.b64EncodeUnicode = function (str) {
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    };
    utility.b64DecodeUnicode = function (str) {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    };
    utility.isEmpty = function (object) {
        for (var variable in object) {
            return false;
        }
        return true;
    };
    return utility;
});
