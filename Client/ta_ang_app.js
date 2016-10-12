var taApp = angular.module('taApp', ['angularPayments']);

taApp.controller('mainController', ['$scope', function($scope) {
    $scope.name ='Main';
}]);

// PASSWORD MATCH VALIDATION DIRECTIVES
taApp.directive('compareTo', function($parse) {
  'ngInject'
  // PASSWORD MATCH VALIDATION
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ngModel) {
      var mainModel = $parse(attrs.compareTo);
      var secondModel = $parse(attrs.ngModel);

      scope.$watch(attrs.ngModel, function(newValue) {
        ngModel.$setValidity(attrs.name, newValue === mainModel(scope));
      });

      scope.$watch(attrs.compareTo, function(newValue) {
        ngModel.$setValidity(attrs.name, newValue === secondModel(scope));
      });

    }
  }
});


// PAYMENT INFO DIRECTIVE
taApp.directive('paymentInfo', function() {
  return {
    restrict: 'E',
    templateUrl: 'payment-info.html'
  }
});

// PAYMENT INFO DIRECTIVE
taApp.directive('reviewInfo', function() {
  return {
    restrict: 'E',
    templateUrl: 'review.html'
  }
});

taApp.directive('thankYou', function() {
	return {
		restrict: 'E',
		templateUrl: 'thank-you.html'
	}
});
