// CART VIEW CONTROLLER
taApp.controller('cartController', ['$scope', 'taDataFactory','orderService', function($scope, taDataFactory, orderService) {
  $scope.shoppingOrder = orderService.shoppingOrder;
  $scope.userLoggedIn = orderService.userLoggedIn;
  
  $scope.removeLine = function(internalId) {
	 taDataFactory.cartUpdate(internalId)
	    .then(function(data) {
	      console.log(data);
	      $scope.shoppingOrder = data;
	   });
  }
}]);