/*global angular*/

angular.module('lbconfigApp', [
    'duScroll',
    'ngMessages',
    'ui.router',
    'ui.bootstrap'
]).config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    'use strict';
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
}).filter('round', function () {
    'use strict';
    return function (input) {
        if (!input) {
            return input;
        }
        return Math.round(input);
    };
}).filter('to_trusted', ['$sce', function ($sce) {
    'use strict';
    return function (text) {
        return $sce.trustAsHtml(text);
    };
}]).constant('CONSTANT', {
    APACHE_MPM_TYPES: {
        PREFORK: 'Prefork',
        WORKER: 'Worker',
        WINNT: 'Winnt',
        EVENT:'Event'
    },
    APACHE_MODULES: {
        MOD_JK: 'mod_jk',
        MOD_PROXY: 'mod_proxy',
        MOD_CLUSTER: 'mod_cluster'
    }
});
