/*global angular*/

angular.module('lbconfigApp').config(function ($stateProvider) {
    'use strict';
    $stateProvider.state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
    });
});
