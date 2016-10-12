
// CART VIEW CONTROLLER
angular.module('taApp').controller('cartController', ['$scope', '$http','orderService', function($scope, $http, orderService) {
  $scope.shoppingOrder = orderService.shoppingOrder;
  $scope.userLoggedIn = orderService.userLoggedIn;
  $scope.removeLine = function(internalId) {
    $http({
      method: 'POST',
      url: 'cartUpdateQuantity.ss',
      data: internalId,
      headers: { 'Content-Type': 'application/json' }
    })
    .success(function(data) {
      console.log(data);
      $scope.shoppingOrder = data;
    });
  }

}]);