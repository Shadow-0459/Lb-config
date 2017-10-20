/*global angular, window, console*/

angular.module('lbconfigApp').controller('MainCtrl', function ($scope, $location, UtilityService, GeneratorService) {
    'use strict';
    $scope.utility = UtilityService;
    $scope.init = function () {
        $scope.config = {
            apacheVersion: '22x',
            apacheServerCount: 1,
            apacheCoresPerServer: 4,
            apacheMPMType: '',
            apacheModuleType: '',
            apacheDiscoveryType: 'mcast',
            beckendVersion: '',
            beckendCoresPerServer: 4,
            beckendJVMsPerServer: 1,
            beckendServerCount: 2,
            isFirewall: false,
            isSameServer: false,
            isLongRunning: false,
            longRunningNum: 10
        };
        $scope.stash = {};
        $scope.isShowConfigurationOutput = false;
        $scope.isShowWarnings = false;
        $scope.isInvalidParameter = false;
    };
    $scope.init();
    $scope.clear = function () {
        $scope.init();
        $scope.lbConfigForm.$setPristine();
        $location.url($location.path());
    };
    $scope.hide = function () {
        $scope.isShowWarnings = false;
        $scope.isShowConfigurationOutput = false;
        $scope.isInvalidParameter = false;
    };
    $scope.generate = function () {
        $scope.isShowWarnings = false;
        $scope.isShowConfigurationOutput = false;
        $scope.isInvalidParameter = false;
        if ($scope.lbConfigForm.$invalid) {
            var invalidElements = [];
            $scope.lbConfigForm.$$controls.forEach(function (element) {
                if (element.$invalid) {
                    element.$dirty = true;
                    invalidElements.push(element);
                }
            });
            $scope.utility.scrollToElementByName(invalidElements[0].$name);
            return false;
        }

        // process config to generate numbers that we need... results are stored in stash
        GeneratorService.calculate($scope.config, $scope.stash);
        // generate all the HTML/text we will be shoving on the page... again results are stored in stash
        GeneratorService.generateTemplates($scope.config, $scope.stash);
        // generate and place warnings
        GeneratorService.generateWarnings($scope.config, $scope.stash);
        // generate the hash AND place it
        GeneratorService.generateURL($scope.config);

        $scope.isShowConfigurationOutput = true;
        if ($scope.stash.warnings.length > 0) {
            $scope.isShowWarnings = true;
            $scope.utility.scrollToElementById('warnings');
        } else {
            $scope.utility.scrollToElementById('configurationOutput');
        }

        window.chrometwo_require(["analytics/main"], function (analytics) {
            analytics.trigger("LabsCompletion");
        });
    };
    var params = $location.hash();
    if (!$scope.utility.isEmpty(params)) {
        params = params.substring(2);
        try {
            params = $scope.utility.b64DecodeUnicode(params);
            $scope.utility.updateConfig($scope.config, params);
        } catch (e) {
            $scope.isInvalidParameter = true;
            console.error(e);
            return false;
        }
        $scope.$on('$viewContentLoaded', function () {
            $scope.generate();
        });
    }
});
